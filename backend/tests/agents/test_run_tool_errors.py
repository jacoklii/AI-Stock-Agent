"""Hermetic tests for ``Researcher._run_tool`` error classification — no Postgres, no network.

The agent's tool-call boundary turns three distinct failures into three distinct tool_results:
- a transient ``ProviderError`` -> a non-retryable result with an "unavailable" note (the loop moves
  on instead of hammering a rate-limited wall),
- a non-transient ``ProviderError`` -> non-retryable, but a "rejected" note (no unavailability),
- a plain exception (e.g. bad args) -> a bare ``{"error": ...}`` with NO ``retryable`` key, which is
  the self-correction signal the loop feeds back to the model.
An off-allowlist tool name is refused outright (the registry allowlist is the stop).
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.agents.researcher import agent as agent_mod
from app.providers.errors import ProviderRequestError, ProviderUnavailable


def _researcher():
    # No LLM calls are made by _run_tool, so a placeholder llm is fine.
    return agent_mod.Researcher(llm=SimpleNamespace())


_SPEC = SimpleNamespace(name="get_company")
_ALLOWLIST = {"get_company": _SPEC}


async def test_transient_provider_error_is_non_retryable_with_unavailable_note(monkeypatch) -> None:
    async def _boom(spec, args):
        raise ProviderUnavailable("voyage embed failed", provider="voyage")

    monkeypatch.setattr(agent_mod, "invoke_tool", _boom)
    result = await _researcher()._run_tool(_ALLOWLIST, "get_company", {"company_id": 1})
    assert result["retryable"] is False
    assert "temporarily unavailable" in result["note"]
    assert "voyage" in result["note"]
    assert result["error"].startswith("ProviderUnavailable:")


async def test_non_transient_provider_error_is_non_retryable_without_unavailable_note(
    monkeypatch,
) -> None:
    async def _boom(spec, args):
        raise ProviderRequestError("bad request", provider="voyage")

    monkeypatch.setattr(agent_mod, "invoke_tool", _boom)
    result = await _researcher()._run_tool(_ALLOWLIST, "get_company", {"company_id": 1})
    assert result["retryable"] is False
    assert "rejected the request" in result["note"]
    assert "temporarily unavailable" not in result["note"]


async def test_internal_exception_is_bare_error_for_self_correction(monkeypatch) -> None:
    async def _boom(spec, args):
        raise ValueError("bad arg")

    monkeypatch.setattr(agent_mod, "invoke_tool", _boom)
    result = await _researcher()._run_tool(_ALLOWLIST, "get_company", {"company_id": 1})
    assert result == {"error": "ValueError: bad arg"}
    assert "retryable" not in result  # the self-correction path stays distinct


async def test_off_allowlist_tool_is_refused() -> None:
    result = await _researcher()._run_tool(_ALLOWLIST, "delete_everything", {})
    assert result == {"error": "tool 'delete_everything' is not permitted for this task"}
