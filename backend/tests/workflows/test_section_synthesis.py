"""Hermetic test for per-section synthesis — no Postgres, no LLM.

The contract: each surveillance domain with events gets one section snapshot upserted under its
domain key; each critical industry with events gets one under ``"industry:<id>"``; empty sections
are skipped (no LLM call); and the per-critical-industry sections are returned for the daily digest.
The researcher, the read tool, and the session/upsert seams are monkeypatched.
"""

from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace

from app.tools.tool_schema import NewsEventResult
from app.workflows.research import section_synthesis
from app.workflows.runtime import TaskHandle

_NOW = datetime(2026, 6, 23, 12, 0, tzinfo=timezone.utc)


def _event(news_event_id: int) -> NewsEventResult:
    return NewsEventResult(
        news_event_id=news_event_id,
        company_id=None,
        url=f"https://example.com/{news_event_id}",
        source="Example",
        published_at=_NOW,
        headline=f"headline {news_event_id}",
        tickers=[],
        significance=0.5,
        summary="av summary",
    )


class _FakeResearcher:
    def __init__(self) -> None:
        self.calls: list[str] = []

    async def run_task(self, task, *, inputs):
        self.calls.append(inputs["section"])
        return SimpleNamespace(snapshot=f"synthesis of {inputs['section']}", key_tickers=["AAA"])


def _patch(monkeypatch, *, events_by_domain, industries, events_by_industry):
    from contextlib import asynccontextmanager

    researcher = _FakeResearcher()
    upserts: list[dict] = []

    @asynccontextmanager
    async def _run_task(*a, **k):
        yield TaskHandle(id=1)

    @asynccontextmanager
    async def _ro():
        yield None

    async def _get_news_events(session, *, domain=None, industry_id=None, limit=40):
        if industry_id is not None:
            return events_by_industry.get(industry_id, [])
        return events_by_domain.get(domain.value if domain is not None else None, [])

    async def _resolve(session):
        return industries

    async def _upsert(**kwargs):
        upserts.append(kwargs)

    monkeypatch.setattr(section_synthesis, "run_task", _run_task)
    monkeypatch.setattr(section_synthesis, "readonly_session", _ro)
    monkeypatch.setattr(section_synthesis, "get_news_events", _get_news_events)
    monkeypatch.setattr(section_synthesis, "_resolve_critical_industries", _resolve)
    monkeypatch.setattr(section_synthesis, "_upsert", _upsert)
    monkeypatch.setattr(section_synthesis, "get_researcher", lambda: researcher)
    return researcher, upserts


async def test_only_sections_with_events_are_synthesized(monkeypatch) -> None:
    researcher, upserts = _patch(
        monkeypatch,
        events_by_domain={"macro": [_event(1), _event(2)]},  # only macro has events
        industries=[],
        events_by_industry={},
    )

    digest_sections = await section_synthesis.run()

    # Exactly one domain section written (macro); the empty domains were skipped.
    keys = [u["section_key"] for u in upserts]
    assert keys == ["macro"]
    assert upserts[0]["snapshot"] == "synthesis of Macroeconomics"
    assert upserts[0]["event_ids"] == [1, 2]
    assert digest_sections == []  # no critical industries → no digest sections


async def test_critical_industries_become_digest_sections(monkeypatch) -> None:
    ind = SimpleNamespace(id=7, name="Semiconductors")
    researcher, upserts = _patch(
        monkeypatch,
        events_by_domain={},  # no domain events
        industries=[ind],
        events_by_industry={7: [_event(9)]},
    )

    digest_sections = await section_synthesis.run()

    assert [u["section_key"] for u in upserts] == ["industry:7"]
    assert len(digest_sections) == 1
    assert digest_sections[0].section_title == "Semiconductors"
    assert digest_sections[0].article_refs == [9]
    assert digest_sections[0].key_tickers == ["AAA"]
