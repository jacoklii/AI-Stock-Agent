"""Hermetic tests for the pause/resume exit of a deep-research session — no Postgres, no LLM.

The contract under test: ``status="complete"`` closes the session and promotes findings;
``status="paused"`` leaves the state row open (the next autonomous wakeup resumes it) and
promotes nothing; an exception still closes. Seams are monkeypatched at module level.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.agents.researcher.schemas import DeepResearchOut
from app.workflows.research import deep_research
from app.workflows.runtime import TaskHandle


class _FakeSession:
    async def __aenter__(self) -> "_FakeSession":
        return self

    async def __aexit__(self, *exc: object) -> bool:
        return False


@asynccontextmanager
async def _fake_run_task(*args, **kwargs):
    yield TaskHandle(id=1)


def _patch_seams(monkeypatch, *, out, state_findings: str | None = "flushed") -> dict:
    """Patch every seam of deep_research.run(); the researcher returns (or raises) ``out``."""
    recorded = {"closed": 0, "promoted": 0, "flushed": []}

    @asynccontextmanager
    async def _fake_ro_session():
        yield None

    async def _remaining(session):
        return None  # uncapped budget

    async def _active():
        return 0

    async def _open(session, *, topic, parent_state_id=None, initiated_by="schedule"):
        return SimpleNamespace(state_id=7)

    async def _recall(query):
        return {"known_analysis": [], "related_sessions": []}

    async def _researcher_run_task(task, *, inputs, budget=None, progress=None, steer=None):
        if isinstance(out, Exception):
            raise out
        return out

    async def _close(session, embeddings, *, state_id):
        recorded["closed"] += 1

    async def _promote(state_id, **fields):
        recorded["promoted"] += 1

    async def _get_state(session, *, state_id):
        return SimpleNamespace(
            state_id=state_id, topic="t", findings=state_findings, open_questions=None
        )

    async def _update(session, *, state_id, **fields):
        recorded["flushed"].append(fields)

    monkeypatch.setattr(deep_research, "readonly_session", _fake_ro_session)
    monkeypatch.setattr(deep_research, "remaining_weekly_budget", _remaining)
    monkeypatch.setattr(deep_research, "_active_count", _active)
    monkeypatch.setattr(deep_research, "open_research", _open)
    monkeypatch.setattr(deep_research, "_recall", _recall)
    monkeypatch.setattr(deep_research, "close_research", _close)
    monkeypatch.setattr(deep_research, "_promote", _promote)
    monkeypatch.setattr(deep_research, "get_research_state", _get_state)
    monkeypatch.setattr(deep_research, "update_research", _update)
    monkeypatch.setattr(deep_research, "SessionLocal", _FakeSession)
    monkeypatch.setattr(deep_research, "run_task", _fake_run_task)
    monkeypatch.setattr(deep_research, "get_embeddings_provider", lambda: None)
    monkeypatch.setattr(
        deep_research, "get_researcher", lambda: SimpleNamespace(run_task=_researcher_run_task)
    )
    return recorded


async def test_paused_session_stays_open_and_promotes_nothing(monkeypatch) -> None:
    out = DeepResearchOut(answer="partial", findings="f", status="paused")
    recorded = _patch_seams(monkeypatch, out=out)
    result = await deep_research.run(query="q", initiated_by="schedule")
    assert result["paused"] is True
    assert recorded["closed"] == 0
    assert recorded["promoted"] == 0


async def test_complete_session_closes_and_promotes(monkeypatch) -> None:
    out = DeepResearchOut(answer="done", findings="f", sources=[1])
    recorded = _patch_seams(monkeypatch, out=out)
    result = await deep_research.run(query="q", initiated_by="schedule")
    assert result["paused"] is False
    assert recorded["closed"] == 1
    assert recorded["promoted"] == 1


async def test_failed_session_still_closes(monkeypatch) -> None:
    recorded = _patch_seams(monkeypatch, out=RuntimeError("boom"))
    with pytest.raises(RuntimeError):
        await deep_research.run(query="q", initiated_by="schedule")
    assert recorded["closed"] == 1
    assert recorded["promoted"] == 0


async def test_pause_safety_net_flushes_only_when_state_is_empty(monkeypatch) -> None:
    out = DeepResearchOut(
        answer="partial", findings="f", status="paused", source_urls=["https://example.com/r"]
    )

    # Agent flushed nothing: the submitted output is persisted so resume has a footing —
    # including the external URLs it cited.
    recorded = _patch_seams(monkeypatch, out=out, state_findings=None)
    await deep_research.run(query="q", initiated_by="schedule")
    assert len(recorded["flushed"]) == 1
    assert recorded["flushed"][0]["source_urls"] == ["https://example.com/r"]

    # Agent flushed during the session: no second write, appends stay non-duplicative.
    recorded = _patch_seams(monkeypatch, out=out, state_findings="already flushed")
    await deep_research.run(query="q", initiated_by="schedule")
    assert recorded["flushed"] == []


def test_status_field_contract() -> None:
    assert DeepResearchOut(answer="a").status == "complete"
    assert DeepResearchOut(answer="a", status="paused").status == "paused"
    with pytest.raises(ValidationError):
        DeepResearchOut(answer="a", status="bogus")
