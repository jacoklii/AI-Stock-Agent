"""Researcher tool-use loop — driven by a fake LLM so no key/network/DB is needed.

Proves the two things the loop guarantees regardless of the model: (1) the task ends by parsing
the ``submit`` tool's input into the task's output schema (structured output is enforced), and
(2) the per-task allowlist is a hard stop — a tool the task wasn't granted is refused, not run.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.agents.researcher.agent import Researcher
from app.agents.researcher.schemas import SnapshotOut
from app.tools.registry import TASK_PULSE_SNAPSHOT


def _tool_use(name: str, inp: dict, block_id: str = "b1"):
    return SimpleNamespace(type="tool_use", name=name, input=inp, id=block_id)


def _response(blocks: list):
    return SimpleNamespace(content=blocks, stop_reason="tool_use")


class FakeLLM:
    """Returns scripted responses in order; records the tools offered on the first call."""

    def __init__(self, scripted: list):
        self._scripted = scripted
        self.calls = 0
        self.offered_tool_names: list[str] = []

    async def create(self, *, tools, **kwargs):
        if self.calls == 0:
            self.offered_tool_names = [t["name"] for t in tools]
        resp = self._scripted[self.calls]
        self.calls += 1
        return resp


async def test_loop_returns_validated_output_on_submit():
    llm = FakeLLM([_response([_tool_use("submit_pulse_snapshot", {"snapshot": "Markets ticked up."})])])
    researcher = Researcher(llm=llm)
    result = await researcher.run_task(TASK_PULSE_SNAPSHOT, inputs={"instruments": []})
    assert isinstance(result, SnapshotOut)
    assert result.snapshot == "Markets ticked up."
    # The submit tool is always offered alongside the task's allowlist.
    assert "submit_pulse_snapshot" in llm.offered_tool_names


async def test_disallowed_tool_is_refused_then_submit():
    # pulse_snapshot's allowlist does not include get_financials; the loop must refuse it
    # (returning an error tool_result), then accept the subsequent submit.
    llm = FakeLLM(
        [
            _response([_tool_use("get_financials", {"company_id": 1})]),
            _response([_tool_use("submit_pulse_snapshot", {"snapshot": "ok"})]),
        ]
    )
    researcher = Researcher(llm=llm)
    result = await researcher.run_task(TASK_PULSE_SNAPSHOT, inputs={"instruments": []})
    assert result.snapshot == "ok"
    assert "get_financials" not in llm.offered_tool_names  # never even offered for this task
