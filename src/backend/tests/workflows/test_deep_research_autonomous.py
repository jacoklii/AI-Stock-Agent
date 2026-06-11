"""Hermetic tests for the self-directed deep-research entry — no Postgres, no LLM.

``run_autonomous`` makes exactly one decision: resume unfinished work, rest, or open a
self-directed session. The DB lookups and the session runner are monkeypatched at their seams
(``_oldest_open_session``, ``_candidates``, ``_expire_stale_sessions``, ``run``) so the decision
logic is tested in isolation. The workflow-slot guard is real; tests clear it between runs.
"""

from __future__ import annotations

import asyncio

from app.workflows import concurrency, deep_research


def _no_open_session(monkeypatch) -> None:
    async def _none():
        return None

    monkeypatch.setattr(deep_research, "_oldest_open_session", _none)


def _no_expiry(monkeypatch, calls: list[str] | None = None) -> None:
    async def _noop():
        if calls is not None:
            calls.append("expire")

    concurrency._workflow_slots.clear()
    monkeypatch.setattr(deep_research, "_expire_stale_sessions", _noop)


async def test_resumes_oldest_open_session(monkeypatch) -> None:
    async def _open():
        return (42, "nvidia supply chain")

    captured = {}

    async def _run(**kwargs):
        captured.update(kwargs)
        return {"blocked": False}

    _no_expiry(monkeypatch)
    monkeypatch.setattr(deep_research, "_oldest_open_session", _open)
    monkeypatch.setattr(deep_research, "run", _run)
    await deep_research.run_autonomous()
    assert captured["resume_state_id"] == 42
    assert captured["query"] == "nvidia supply chain"
    assert captured["initiated_by"] == "schedule"


async def test_rests_when_nothing_is_material(monkeypatch) -> None:
    async def _empty():
        return {"significant_events": [], "open_questions": []}

    _no_expiry(monkeypatch)
    _no_open_session(monkeypatch)
    monkeypatch.setattr(deep_research, "_candidates", _empty)
    result = await deep_research.run_autonomous()
    assert result["skipped"] is True


async def test_opens_self_directed_session_with_candidates(monkeypatch) -> None:
    candidates = {
        "significant_events": [{"news_event_id": 7, "headline": "h", "significance": 0.9}],
        "open_questions": [],
    }

    async def _some():
        return candidates

    captured = {}

    async def _run(**kwargs):
        captured.update(kwargs)
        return {"blocked": False}

    _no_expiry(monkeypatch)
    _no_open_session(monkeypatch)
    monkeypatch.setattr(deep_research, "_candidates", _some)
    monkeypatch.setattr(deep_research, "run", _run)
    await deep_research.run_autonomous()
    assert captured["candidates"] is candidates
    assert captured["initiated_by"] == "schedule"


async def test_expires_stale_sessions_before_resuming(monkeypatch) -> None:
    calls: list[str] = []

    async def _open():
        calls.append("oldest")
        return None

    async def _empty():
        return {"significant_events": [], "open_questions": []}

    _no_expiry(monkeypatch, calls)
    monkeypatch.setattr(deep_research, "_oldest_open_session", _open)
    monkeypatch.setattr(deep_research, "_candidates", _empty)
    await deep_research.run_autonomous()
    assert calls == ["expire", "oldest"]


async def test_concurrent_wakeup_is_skipped_not_queued(monkeypatch) -> None:
    started = asyncio.Event()
    release = asyncio.Event()

    async def _parked():
        started.set()
        await release.wait()
        return None

    async def _empty():
        return {"significant_events": [], "open_questions": []}

    _no_expiry(monkeypatch)
    monkeypatch.setattr(deep_research, "_oldest_open_session", _parked)
    monkeypatch.setattr(deep_research, "_candidates", _empty)

    first = asyncio.create_task(deep_research.run_autonomous())
    await started.wait()
    second = await deep_research.run_autonomous()
    assert second == {"skipped": True, "reason": "deep research already running"}
    release.set()
    result = await first
    assert result["skipped"] is True  # parked run then rested (no candidates)
