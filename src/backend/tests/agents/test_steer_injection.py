"""Hermetic test for mid-session redirect steering — no Postgres, no network.

``run_task`` polls the optional ``steer`` callback each iteration; when it returns text the agent
must deliver it to the model as a user instruction at the next user turn (riding alongside the
tool results), without breaking the strict user/assistant turn structure. This drives a session
where a redirect is pending on the first turn and asserts the steer text reaches ``messages`` as a
text block on the tool-result turn, prefixed so the model treats it as a steer.
"""

from __future__ import annotations

from app.agents.researcher import agent as agent_mod
from app.tools.registry import TASK_FOLLOWUP

from test_progress_heartbeat import _Block, _Resp, _ScriptedLLM


async def test_pending_redirect_is_injected_at_next_user_turn(monkeypatch) -> None:
    captured: dict[str, list] = {}

    async def _granted_tool(spec, args):
        return {"ticker": "ACME"}

    monkeypatch.setattr(agent_mod, "invoke_tool", _granted_tool)

    # A real LLM client isn't used; capture the messages the agent built on the submit call so we
    # can prove the steer text landed in the conversation before the model's final turn.
    class _CapturingLLM(_ScriptedLLM):
        async def create(self, **kwargs):
            captured["messages"] = list(kwargs["messages"])
            return self._responses.pop(0)

    llm = _CapturingLLM(
        _Resp(_Block("get_company", {"company_id": 1})),  # first turn runs a client tool
        _Resp(_Block("submit_followup", {"answer": "ok", "sources": [1]})),  # then submits
    )

    # Steer fires exactly once (on the first poll), then drains.
    steers = ["focus on TSMC advanced-node capacity instead"]

    async def _steer() -> str | None:
        return steers.pop(0) if steers else None

    out = await agent_mod.Researcher(llm=llm).run_task(
        TASK_FOLLOWUP, inputs={"query": "q"}, steer=_steer
    )
    assert out.answer == "ok"

    # By the submit call, the conversation must contain the steer text as a user-turn text block,
    # carrying the redirect prefix so it reads as a course-correction (not a fact to research).
    blob = str(captured["messages"])
    assert "focus on TSMC advanced-node capacity instead" in blob
    assert agent_mod._STEER_PREFIX.strip() in blob


async def test_no_steer_callback_is_a_noop(monkeypatch) -> None:
    """A session with no steer callback must behave exactly as before (no injection, no crash)."""

    async def _granted_tool(spec, args):
        return {"ticker": "ACME"}

    monkeypatch.setattr(agent_mod, "invoke_tool", _granted_tool)
    llm = _ScriptedLLM(
        _Resp(_Block("get_company", {"company_id": 1})),
        _Resp(_Block("submit_followup", {"answer": "ok", "sources": [1]})),
    )
    out = await agent_mod.Researcher(llm=llm).run_task(TASK_FOLLOWUP, inputs={"query": "q"})
    assert out.answer == "ok"
