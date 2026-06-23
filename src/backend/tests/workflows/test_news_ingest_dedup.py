"""Hermetic tests for ingest dedup, the signal-convergence wakeup, and the overlap guard —
no Postgres, no LLM, no embeddings. Seams (`_fetch_events`, `_existing_urls`, the rescore/wakeup
calls, the session factory, `run_task`) are monkeypatched so each rule is tested in isolation.
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from app.workflows import concurrency
from app.workflows.research import news_ingest
from app.workflows.runtime import TaskHandle


def _event(
    url: str,
    company_id: int | None = None,
    headline: str | None = None,
    relevance: float = 0.5,
) -> news_ingest.RawEvent:
    return news_ingest.RawEvent(
        url=url,
        source="src",
        published_at=datetime.now(timezone.utc),
        headline=headline if headline is not None else f"headline {url}",
        tickers=["AAA"],
        company_id=company_id,
        summary="av summary",
        relevance=relevance,
    )


class _FakeSession:
    def __init__(self) -> None:
        self.added: list[object] = []

    async def __aenter__(self) -> "_FakeSession":
        return self

    async def __aexit__(self, *exc: object) -> bool:
        return False

    def add(self, row: object) -> None:
        self.added.append(row)

    async def commit(self) -> None:
        pass


@asynccontextmanager
async def _fake_run_task(*args, **kwargs):
    yield TaskHandle(id=1)


def _patch_seams(monkeypatch, *, fetched, known, significance) -> dict:
    """Patch every seam of news_ingest.run(); return recorders for assertions.

    ``significance`` is the Alpha Vantage relevance the fetched events carry — it is both the ingest
    filter input and the stored significance (which drives the deep-research wakeup)."""
    concurrency._workflow_slots.clear()
    for e in fetched:
        e.relevance = significance
    session = _FakeSession()
    recorded: dict = {"session": session, "rescored": [], "wakeups": 0}

    async def _fetch():
        return fetched

    async def _existing(urls):
        return known

    async def _existing_headlines():
        return set()

    async def _rescore(company_ids):
        recorded["rescored"].append(company_ids)

    async def _wakeup():
        recorded["wakeups"] += 1

    monkeypatch.setattr(news_ingest, "_fetch_events", _fetch)
    monkeypatch.setattr(news_ingest, "_existing_urls", _existing)
    monkeypatch.setattr(news_ingest, "_existing_headlines", _existing_headlines)
    monkeypatch.setattr(news_ingest, "_enqueue_rescore", _rescore)
    monkeypatch.setattr(news_ingest, "_wakeup_deep_research", _wakeup)
    monkeypatch.setattr(news_ingest, "SessionLocal", lambda: session)
    monkeypatch.setattr(news_ingest, "run_task", _fake_run_task)
    return recorded


def _written(recorded: dict) -> list[str]:
    return [row.url for row in recorded["session"].added]


def test_dedupe_batch_keeps_first_occurrence() -> None:
    events = [_event("u1"), _event("u2"), _event("u1")]
    assert [e.url for e in news_ingest._dedupe_batch(events)] == ["u1", "u2"]


async def test_known_urls_are_never_written(monkeypatch) -> None:
    recorded = _patch_seams(
        monkeypatch, fetched=[_event("u1"), _event("u2")], known={"u1"}, significance=0.5
    )
    await news_ingest.run()
    assert _written(recorded) == ["u2"]


async def test_av_summary_is_stored_verbatim(monkeypatch) -> None:
    """The row's canonical summary is Alpha Vantage's own — ingest writes no LLM summary."""
    recorded = _patch_seams(monkeypatch, fetched=[_event("u1")], known=set(), significance=0.5)
    await news_ingest.run()
    [row] = recorded["session"].added
    assert row.summary == "av summary"
    assert row.significance == 0.5


async def test_material_event_wakes_deep_research(monkeypatch) -> None:
    recorded = _patch_seams(monkeypatch, fetched=[_event("u1")], known=set(), significance=0.9)
    await news_ingest.run()
    assert recorded["wakeups"] == 1


async def test_routine_event_does_not_wake_deep_research(monkeypatch) -> None:
    recorded = _patch_seams(monkeypatch, fetched=[_event("u1")], known=set(), significance=0.3)
    await news_ingest.run()
    assert recorded["wakeups"] == 0


async def test_low_relevance_item_is_dropped_before_write(monkeypatch) -> None:
    """An item below the Alpha Vantage relevance floor is dropped after dedup — never written.
    Ingest trusts AV's relevance instead of an LLM importance call."""
    recorded = _patch_seams(
        monkeypatch, fetched=[_event("u1", company_id=5)], known=set(), significance=0.02
    )
    await news_ingest.run()
    assert _written(recorded) == []
    assert recorded["rescored"] == []
    assert recorded["wakeups"] == 0


async def test_concurrent_ingest_skips(monkeypatch) -> None:
    """Second run while the first holds the slot returns without fetching."""
    recorded = _patch_seams(monkeypatch, fetched=[], known=set(), significance=0.5)
    started = asyncio.Event()
    release = asyncio.Event()
    fetches = 0

    async def _parked_fetch():
        nonlocal fetches
        fetches += 1
        started.set()
        await release.wait()
        return []

    monkeypatch.setattr(news_ingest, "_fetch_events", _parked_fetch)
    first = asyncio.create_task(news_ingest.run())
    await started.wait()
    await news_ingest.run()  # skips: slot is held
    assert fetches == 1
    release.set()
    await first
    assert fetches == 1
    assert recorded["wakeups"] == 0
