"""Hermetic tests for ingest dedup, the signal-convergence wakeup, and the overlap guard —
no Postgres, no LLM. Seams (`_fetch_events`, `_existing_urls`, the researcher calls, the
session factories, `run_task`) are monkeypatched so each rule is tested in isolation.
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from types import SimpleNamespace

from app.workflows import concurrency
from app.workflows.research import news_ingest
from app.workflows.runtime import TaskHandle


def _event(url: str, company_id: int | None = None) -> news_ingest.RawEvent:
    return news_ingest.RawEvent(
        url=url,
        source="src",
        published_at=datetime.now(timezone.utc),
        headline="h",
        tickers=["AAA"],
        company_id=company_id,
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


class _FakeEmbeddings:
    async def embed_query(self, text: str) -> SimpleNamespace:
        return SimpleNamespace(vector=[0.0], model="fake")


@asynccontextmanager
async def _fake_run_task(*args, **kwargs):
    yield TaskHandle(id=1)


def _patch_seams(monkeypatch, *, fetched, known, significance) -> dict:
    """Patch every seam of news_ingest.run(); return recorders for assertions."""
    concurrency._workflow_slots.clear()
    recorded = {"summarized": [], "rescored": [], "wakeups": 0}

    async def _fetch():
        return fetched

    async def _existing(urls):
        return known

    async def _summarize(event):
        recorded["summarized"].append(event.url)
        return SimpleNamespace(summary="s")

    async def _classify(event, summary):
        return significance

    async def _rescore(company_ids):
        recorded["rescored"].append(company_ids)

    async def _wakeup():
        recorded["wakeups"] += 1

    monkeypatch.setattr(news_ingest, "_fetch_events", _fetch)
    monkeypatch.setattr(news_ingest, "_existing_urls", _existing)
    monkeypatch.setattr(news_ingest, "_summarize", _summarize)
    monkeypatch.setattr(news_ingest, "_classify_significance", _classify)
    monkeypatch.setattr(news_ingest, "_enqueue_rescore", _rescore)
    monkeypatch.setattr(news_ingest, "_wakeup_deep_research", _wakeup)
    monkeypatch.setattr(news_ingest, "get_embeddings_provider", lambda: _FakeEmbeddings())
    monkeypatch.setattr(news_ingest, "SessionLocal", _FakeSession)
    monkeypatch.setattr(news_ingest, "run_task", _fake_run_task)
    return recorded


def test_dedupe_batch_keeps_first_occurrence() -> None:
    events = [_event("u1"), _event("u2"), _event("u1")]
    assert [e.url for e in news_ingest._dedupe_batch(events)] == ["u1", "u2"]


async def test_known_urls_never_reach_the_summarizer(monkeypatch) -> None:
    recorded = _patch_seams(
        monkeypatch, fetched=[_event("u1"), _event("u2")], known={"u1"}, significance=0.5
    )
    await news_ingest.run()
    assert recorded["summarized"] == ["u2"]


async def test_material_event_wakes_deep_research(monkeypatch) -> None:
    recorded = _patch_seams(monkeypatch, fetched=[_event("u1")], known=set(), significance=0.9)
    await news_ingest.run()
    assert recorded["wakeups"] == 1


async def test_routine_event_does_not_wake_deep_research(monkeypatch) -> None:
    recorded = _patch_seams(monkeypatch, fetched=[_event("u1")], known=set(), significance=0.5)
    await news_ingest.run()
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
