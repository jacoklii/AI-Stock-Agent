"""Hermetic agent-loop tests — no Postgres, no network.

The LLM is a scripted stub and ``invoke_tool`` is monkeypatched, so these exercise the loop's
self-correction behaviour in isolation: a failing tool is surfaced as an error tool_result (not a
crash), an invalid submit payload is bounced back for a fix, and an ungrounded result is nudged
for citations before being accepted.
"""

from __future__ import annotations

import json
from types import SimpleNamespace

from app.agents.researcher import agent as agent_mod
from app.tools.registry import TASK_DEEP_RESEARCH, TASK_FOLLOWUP, TASK_SECTION_SNAPSHOT


class _Block:
    def __init__(self, name: str, input: dict, id: str = "tu_1", type: str = "tool_use") -> None:
        self.type = type
        self.name = name
        self.input = input
        self.id = id


class _Resp:
    def __init__(
        self,
        *blocks: _Block,
        stop_reason: str | None = None,
        usage: object = None,
        container_id: str | None = None,
    ) -> None:
        self.content = list(blocks)
        self.usage = usage
        self.stop_reason = stop_reason
        self.container = SimpleNamespace(id=container_id) if container_id else None


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
        _Resp(_Block("submit_deep_research", {**submit, "sources": [], "source_urls": []})),
        _Resp(_Block("submit_deep_research", {**submit, "sources": [7]})),
    )
    out = await agent_mod.Researcher(llm=llm).run_task(TASK_DEEP_RESEARCH, inputs={"query": "q"})
    assert out.sources == [7]
    assert "cite" in _last_tool_result(llm.calls[1])["content"]


async def test_url_only_grounding_is_accepted() -> None:
    """Findings cited by external URLs alone (no stored events) are grounded — no nudge."""
    submit = {
        "answer": "a",
        "findings": "f",
        "sources": [],
        "source_urls": ["https://example.com/report"],
    }
    llm = _ScriptedLLM(_Resp(_Block("submit_deep_research", submit)))
    out = await agent_mod.Researcher(llm=llm).run_task(TASK_DEEP_RESEARCH, inputs={"query": "q"})
    assert out.source_urls == ["https://example.com/report"]
    assert len(llm.calls) == 1


async def test_server_web_tools_attached_only_for_web_tasks() -> None:
    llm = _ScriptedLLM(_Resp(_Block("submit_followup", {"answer": "ok", "sources": [1]})))
    await agent_mod.Researcher(llm=llm).run_task(TASK_FOLLOWUP, inputs={"query": "q"})
    types = {t.get("type") for t in llm.calls[0]["tools"]}
    assert {"web_search_20260209", "web_fetch_20260209"} <= types

    llm = _ScriptedLLM(
        _Resp(_Block(f"submit_{TASK_SECTION_SNAPSHOT}", {"snapshot": "s", "key_tickers": []}))
    )
    await agent_mod.Researcher(llm=llm).run_task(TASK_SECTION_SNAPSHOT, inputs={"text": "t"})
    assert all(t.get("type") is None for t in llm.calls[0]["tools"])


async def test_pause_turn_resumes_without_user_nudge() -> None:
    """A pause_turn mid server-tool turn re-sends the conversation unchanged — the loop must
    not mistake it for a no-tool answer and inject a user nudge."""
    paused = _Resp(
        _Block("web_search", {"query": "spacex"}, id="st_1", type="server_tool_use"),
        stop_reason="pause_turn",
    )
    llm = _ScriptedLLM(
        paused, _Resp(_Block("submit_followup", {"answer": "ok", "sources": [1]}))
    )
    out = await agent_mod.Researcher(llm=llm).run_task(TASK_FOLLOWUP, inputs={"query": "q"})
    assert out.answer == "ok"
    assert llm.calls[1]["messages"][-1]["role"] == "assistant"


async def test_paused_server_turn_defers_force_and_carries_container() -> None:
    """While a server turn is paused: the response's container id rides every later call, and a
    budget-triggered forced submit defers (a tool_choice over pending server uses is a 400)."""
    from app.agents.budget import Budget

    over = SimpleNamespace(input_tokens=10, output_tokens=10)  # busts the ceiling immediately
    paused = _Resp(
        _Block("web_fetch", {"url": "https://x"}, id="st_1", type="server_tool_use"),
        stop_reason="pause_turn",
        usage=over,
        container_id="cont_1",
    )
    llm = _ScriptedLLM(
        paused, _Resp(_Block("submit_followup", {"answer": "ok", "sources": [1]}))
    )
    out = await agent_mod.Researcher(llm=llm).run_task(
        TASK_FOLLOWUP, inputs={"query": "q"}, budget=Budget(ceiling=1)
    )
    assert out.answer == "ok"
    assert llm.calls[0]["container"] is None
    assert llm.calls[1]["container"] == "cont_1"
    assert llm.calls[1]["tool_choice"] == {"type": "auto"}  # force deferred past the pause


async def test_unresolved_server_tool_use_resumes_instead_of_nudging() -> None:
    """A completed turn can carry a code_execution server_tool_use with no result block — the
    code_execution that web_search/web_fetch run internally for dynamic filtering, whose result is
    consumed server-side. The loop must re-send to resume it, NOT append a user nudge: a user turn
    after an unresolved server_tool_use is rejected by Anthropic with a 400 ("code_execution tool
    use ... without a corresponding code_execution_tool_result block")."""
    dangling = _Resp(
        _Block("code_execution", {"code": "..."}, id="srv_1", type="server_tool_use"),
        stop_reason="end_turn",  # not pause_turn — the old code only resumed on pause_turn
    )
    llm = _ScriptedLLM(
        dangling,
        _Resp(_Block("submit_followup", {"answer": "ok", "sources": [1]})),
    )
    out = await agent_mod.Researcher(llm=llm).run_task(TASK_FOLLOWUP, inputs={"query": "q"})
    assert out.answer == "ok"
    # The resume request carries the assistant turn unchanged as its last message — no user nudge
    # was appended after the unresolved server_tool_use.
    last = llm.calls[1]["messages"][-1]
    assert last["role"] == "assistant"
    assert last["content"] is dangling.content


def test_has_unresolved_server_tool() -> None:
    """A server_tool_use with no matching *_tool_result is unresolved; one whose result block is
    present (by tool_use_id) is not; content with no server tools is never unresolved."""
    use = _Block("code_execution", {}, id="srv_1", type="server_tool_use")
    result = SimpleNamespace(type="code_execution_tool_result", tool_use_id="srv_1")
    assert agent_mod._has_unresolved_server_tool([use]) is True
    assert agent_mod._has_unresolved_server_tool([use, result]) is False
    assert agent_mod._has_unresolved_server_tool([_Block("submit", {})]) is False


def test_usage_components_split_and_blend() -> None:
    """The agent extracts raw components; Budget keeps them split and derives the cost-weighted
    figure: input + output + 1.25x cache writes + 0.1x cache reads."""
    from app.agents.budget import Budget

    usage = SimpleNamespace(
        input_tokens=100,
        output_tokens=10,
        cache_creation_input_tokens=1000,
        cache_read_input_tokens=10_000,
    )
    assert agent_mod._usage_components(SimpleNamespace(usage=usage)) == (100, 10, 1000, 10_000)

    b = Budget()
    b.add_usage(*agent_mod._usage_components(SimpleNamespace(usage=usage)))
    assert (b.input, b.output, b.cache_write, b.cache_read) == (100, 10, 1000, 10_000)
    assert b.spent == 2360  # 100 + 10 + 1.25*1000 + 0.1*10000

    # Responses without cache fields reduce to input+output; no usage -> all zeros.
    plain = SimpleNamespace(input_tokens=5, output_tokens=2)
    assert agent_mod._usage_components(SimpleNamespace(usage=plain)) == (5, 2, 0, 0)
    assert agent_mod._usage_components(SimpleNamespace(usage=None)) == (0, 0, 0, 0)

    b.note_web("web_search")
    b.note_web("web_search")
    b.note_web("web_fetch")
    assert b.web_tool_uses == {"web_search": 2, "web_fetch": 1}
