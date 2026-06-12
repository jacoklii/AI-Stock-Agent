"""Hermetic LLM-provider tests — the transport wrapper against a stub client.

The contract under test: prompt caching is always on (top-level ``cache_control`` on every
request), and the optional ``tools`` / ``tool_choice`` / ``extra_headers`` pass through only
when given.
"""

from __future__ import annotations

from types import SimpleNamespace

from app.providers.llm import LLMProvider


class _StubMessages:
    def __init__(self) -> None:
        self.calls: list[dict] = []

    async def create(self, **kwargs):
        self.calls.append(kwargs)
        return SimpleNamespace(content=[], stop_reason="end_turn")


def _provider() -> tuple[LLMProvider, _StubMessages]:
    provider = LLMProvider()
    stub = _StubMessages()
    provider._client = SimpleNamespace(messages=stub)
    return provider, stub


async def test_cache_control_is_always_sent() -> None:
    provider, stub = _provider()
    await provider.create(model="m", system="s", messages=[{"role": "user", "content": "x"}])
    call = stub.calls[0]
    assert call["cache_control"] == {"type": "ephemeral"}
    assert "tools" not in call
    assert "tool_choice" not in call
    assert "extra_headers" not in call


async def test_optional_params_pass_through() -> None:
    provider, stub = _provider()
    tools = [{"name": "t", "description": "d", "input_schema": {"type": "object"}}]
    await provider.create(
        model="m",
        system="s",
        messages=[],
        tools=tools,
        tool_choice={"type": "auto"},
        container="cont_1",
        extra_headers={"anthropic-beta": "whatever-it-takes"},
    )
    call = stub.calls[0]
    assert call["tools"] is tools
    assert call["tool_choice"] == {"type": "auto"}
    assert call["container"] == "cont_1"
    assert call["extra_headers"] == {"anthropic-beta": "whatever-it-takes"}
    assert call["cache_control"] == {"type": "ephemeral"}
