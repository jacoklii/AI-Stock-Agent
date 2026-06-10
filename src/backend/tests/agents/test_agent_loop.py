"""Hermetic agent-loop tests — no Postgres, no network.

The LLM is a scripted stub and ``invoke_tool`` is monkeypatched, so these exercise the loop's
self-correction behaviour in isolation: a failing tool is surfaced as an error tool_result (not a
crash), an invalid submit payload is bounced back for a fix, and an ungrounded result is nudged
for citations before being accepted.
"""

from __future__ import annotations

import json

from app.agents.researcher import agent as agent_mod
from app.tools.registry import TASK_DEEP_RESEARCH, TASK_FOLLOWUP


class _Block:
    def __init__(self, name: str, input: dict, id: str = "tu_1") -> None:
        self.type = "tool_use"
        self.name = name
        self.input = input
        self.id = id


class _Resp:
    def __init__(self, *blocks: _Block) -> None:
        self.content = list(blocks)
        self.usage = None


class _ScriptedLLM:
    """Returns the scripted responses in order; records every request it receives."""

    def __init__(self, *responses: _Resp) -> None:
        self._responses = list(responses)
        self.calls: list[dict] = []

    async def create(self, **kwargs) -> _Resp:
        # Snapshot the message list — the loop mutates it in place after the call.
        self.calls.append({**kwargs, "messages": list(kwargs["messages"])})
        return self._responses.pop(0)


def _last_tool_result(call: dict) -> dict:
    """The tool_result block the loop fed back before this LLM call."""
    return call["messages"][-1]["content"][0]


async def test_tool_error_is_fed_back_not_raised(monkeypatch) -> None:
    async def _boom(spec, args):
        raise RuntimeError("boom")

    monkeypatch.setattr(agent_mod, "invoke_tool", _boom)
    llm = _ScriptedLLM(
        _Resp(_Block("get_company", {"company_id": 1})),
        _Resp(_Block("submit_followup", {"answer": "ok", "sources": [1]})),
    )
    out = await agent_mod.Researcher(llm=llm).run_task(TASK_FOLLOWUP, inputs={"query": "q"})
    assert out.answer == "ok"
    result = _last_tool_result(llm.calls[1])
    assert json.loads(result["content"]) == {"error": "RuntimeError: boom"}


async def test_invalid_submit_is_bounced_for_correction() -> None:
    llm = _ScriptedLLM(
        _Resp(_Block("submit_followup", {"sources": []})),  # missing required `answer`
        _Resp(_Block("submit_followup", {"answer": "fixed", "sources": []})),
    )
    out = await agent_mod.Researcher(llm=llm).run_task(TASK_FOLLOWUP, inputs={"query": "q"})
    assert out.answer == "fixed"
    result = _last_tool_result(llm.calls[1])
    assert result["is_error"] is True
    assert "Invalid result" in result["content"]


async def test_ungrounded_findings_are_nudged_for_citations() -> None:
    submit = {"answer": "a", "findings": "f", "open_questions": ""}
    llm = _ScriptedLLM(
        _Resp(_Block("submit_deep_research", {**submit, "sources": []})),
        _Resp(_Block("submit_deep_research", {**submit, "sources": [7]})),
    )
    out = await agent_mod.Researcher(llm=llm).run_task(TASK_DEEP_RESEARCH, inputs={"query": "q"})
    assert out.sources == [7]
    assert "cite" in _last_tool_result(llm.calls[1])["content"]
