"""Hermetic test for the per-iteration progress heartbeat — no Postgres, no network.

``run_task`` awaits the optional ``progress`` callback once per loop iteration with a DB-agnostic
snapshot. This drives a two-turn scripted session (a granted tool call, then the submit) and asserts
the heartbeat fired once per iteration, the phase flips from "gathering" (a tool ran) to
"synthesizing" (the submit turn), and ``iteration`` increments.
"""

from __future__ import annotations

from types import SimpleNamespace

from app.agents.researcher import agent as agent_mod
from app.tools.registry import TASK_FOLLOWUP


class _Block:
    def __init__(self, name: str, input: dict, id: str = "tu_1", type: str = "tool_use") -> None:
        self.type = type
        self.name = name
        self.input = input
        self.id = id


class _Resp:
    def __init__(self, *blocks: _Block, stop_reason: str | None = None) -> None:
        self.content = list(blocks)
        self.usage = None
        self.stop_reason = stop_reason
        self.container = None


class _ScriptedLLM:
    def __init__(self, *responses: _Resp) -> None:
        self._responses = list(responses)

    async def create(self, **kwargs) -> _Resp:
        return self._responses.pop(0)


async def test_progress_fires_per_iteration_and_tracks_phase(monkeypatch) -> None:
    async def _granted_tool(spec, args):
        return {"ticker": "ACME"}  # trivial dict; the loop feeds it back as a tool_result

    monkeypatch.setattr(agent_mod, "invoke_tool", _granted_tool)

    llm = _ScriptedLLM(
        _Resp(_Block("get_company", {"company_id": 1})),  # gathering turn
        _Resp(_Block("submit_followup", {"answer": "ok", "sources": [1]})),  # synthesizing turn
    )

    snapshots: list[dict] = []

    async def _progress(snap: dict) -> None:
        snapshots.append(snap)

    out = await agent_mod.Researcher(llm=llm).run_task(
        TASK_FOLLOWUP, inputs={"query": "q"}, progress=_progress
    )
    assert out.answer == "ok"

    # One beat per loop iteration.
    assert len(snapshots) == 2

    # First iteration ran a tool -> gathering; second submitted -> synthesizing.
    assert snapshots[0]["phase"] == "gathering"
    assert snapshots[1]["phase"] == "synthesizing"

    # Iteration counter increments (attempt + 1).
    assert [s["iteration"] for s in snapshots] == [1, 2]

    # Cumulative tool-call counter: 1 after the gathering turn, then 2 once the submit tool_use
    # (itself a tool_use block) is counted on the synthesizing turn.
    assert snapshots[0]["tool_calls"] == 1
    assert snapshots[1]["tool_calls"] == 2

    # No budget given -> tokens_spent is 0, and max_iters is exposed.
    assert snapshots[0]["tokens_spent"] == 0
    assert snapshots[0]["max_iters"] >= 2
