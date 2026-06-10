"""Hermetic tests for the self-directed deep-research entry — no Postgres, no LLM.

``run_autonomous`` makes exactly one decision: resume unfinished work, rest, or open a
self-directed session. The DB lookups and the session runner are monkeypatched at their seams
(``_oldest_open_session``, ``_candidates``, ``run``) so the decision logic is tested in isolation.
"""

from __future__ import annotations

from app.workflows import deep_research


def _no_open_session(monkeypatch) -> None:
    async def _none():
        return None

    monkeypatch.setattr(deep_research, "_oldest_open_session", _none)


async def test_resumes_oldest_open_session(monkeypatch) -> None:
    async def _open():
        return (42, "nvidia supply chain")

    captured = {}

    async def _run(**kwargs):
        captured.update(kwargs)
        return {"blocked": False}

    monkeypatch.setattr(deep_research, "_oldest_open_session", _open)
    monkeypatch.setattr(deep_research, "run", _run)
    await deep_research.run_autonomous()
    assert captured["resume_state_id"] == 42
    assert captured["query"] == "nvidia supply chain"
    assert captured["initiated_by"] == "schedule"


async def test_rests_when_nothing_is_material(monkeypatch) -> None:
    async def _empty():
        return {"significant_events": [], "open_questions": []}

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

    _no_open_session(monkeypatch)
    monkeypatch.setattr(deep_research, "_candidates", _some)
    monkeypatch.setattr(deep_research, "run", _run)
    await deep_research.run_autonomous()
    assert captured["candidates"] is candidates
    assert captured["initiated_by"] == "schedule"
