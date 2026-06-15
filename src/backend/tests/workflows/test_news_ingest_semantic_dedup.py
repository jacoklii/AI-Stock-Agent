"""Hermetic tests for the near-duplicate dedup gates — no Postgres, no LLM, no embeddings API.

Two layers guard against the same story becoming many events:
- a **lexical** gate on the normalized headline (in-batch via ``_dedupe_batch``, against the DB via
  ``_existing_headlines``), run before any AI spend;
- a **semantic** gate that, after the summary is embedded, drops a row whose summary embedding is
  near-identical (cosine ≥ threshold) to a recently-stored or this-run event — reusing the embedding
  already computed, never a fresh one.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from types import SimpleNamespace

from app.db.models.news import NewsEvent
from app.workflows import concurrency
from app.workflows.research import news_ingest
from app.workflows.runtime import TaskHandle


# --- pure helpers ------------------------------------------------------------


def test_norm_headline_collapses_punctuation_and_case() -> None:
    a = news_ingest._norm_headline("Fed Holds Rates Steady!")
    b = news_ingest._norm_headline("  fed holds rates steady  ")
    assert a == b == "fed holds rates steady"


def test_dedupe_batch_drops_reprinted_headline_under_different_url() -> None:
    events = [
        news_ingest.RawEvent(
            url="https://outlet-a", source=None, published_at=datetime.now(timezone.utc),
            headline="Fed Holds Rates Steady",
        ),
        news_ingest.RawEvent(
            url="https://outlet-b", source=None, published_at=datetime.now(timezone.utc),
            headline="fed holds rates steady!",  # same story, different outlet
        ),
    ]
    unique = news_ingest._dedupe_batch(events)
    assert [e.url for e in unique] == ["https://outlet-a"]


def test_max_similarity_only_compares_same_model() -> None:
    v = [1.0, 0.0]
    pool = [([1.0, 0.0], "other-model"), ([0.0, 1.0], "fake")]
    assert news_ingest._max_similarity(v, "fake", pool) == 0.0  # the identical vec is a diff model


# --- the semantic gate inside run() ------------------------------------------


class _Sink:
    """One reusable fake session capturing every NewsEvent written across the run."""

    def __init__(self) -> None:
        self.added: list[NewsEvent] = []

    async def __aenter__(self) -> "_Sink":
        return self

    async def __aexit__(self, *exc: object) -> bool:
        return False

    def add(self, row: object) -> None:
        self.added.append(row)  # type: ignore[arg-type]

    async def commit(self) -> None:
        pass


class _MapEmbeddings:
    """Embeds a summary to a fixed vector via a lookup — lets a test plant near/far events."""

    def __init__(self, mapping: dict[str, list[float]]) -> None:
        self.mapping = mapping

    async def embed_query(self, text: str) -> SimpleNamespace:
        return SimpleNamespace(vector=self.mapping[text], model="fake")


def _raw(url: str) -> news_ingest.RawEvent:
    # Distinct headlines so the lexical gate never fires — isolating the semantic gate.
    return news_ingest.RawEvent(
        url=url, source="src", published_at=datetime.now(timezone.utc), headline=f"headline {url}"
    )


def _patch(monkeypatch, *, fetched, recent, embeddings, sink, handle, industries=None):
    concurrency._workflow_slots.clear()

    async def _fetch():
        return fetched

    async def _existing_urls(urls):
        return set()

    async def _existing_headlines():
        return set()

    async def _recent_embeddings():
        return recent

    async def _industry_embeddings():
        return industries or []

    async def _summarize(event):
        return SimpleNamespace(summary=event.url)  # summary keyed by url for the embed lookup

    async def _classify(event, summary):
        return 0.5

    async def _rescore(company_ids):
        pass

    async def _wakeup():
        pass

    @asynccontextmanager
    async def _run_task(*args, **kwargs):
        yield handle

    monkeypatch.setattr(news_ingest, "_fetch_events", _fetch)
    monkeypatch.setattr(news_ingest, "_existing_urls", _existing_urls)
    monkeypatch.setattr(news_ingest, "_existing_headlines", _existing_headlines)
    monkeypatch.setattr(news_ingest, "_recent_embeddings", _recent_embeddings)
    monkeypatch.setattr(news_ingest, "_industry_embeddings", _industry_embeddings)
    monkeypatch.setattr(news_ingest, "_summarize", _summarize)
    monkeypatch.setattr(news_ingest, "_classify_significance", _classify)
    monkeypatch.setattr(news_ingest, "_enqueue_rescore", _rescore)
    monkeypatch.setattr(news_ingest, "_wakeup_deep_research", _wakeup)
    monkeypatch.setattr(news_ingest, "get_embeddings_provider", lambda: embeddings)
    monkeypatch.setattr(news_ingest, "SessionLocal", lambda: sink)
    monkeypatch.setattr(news_ingest, "run_task", _run_task)


async def test_semantic_dup_of_stored_event_is_counted_not_written(monkeypatch) -> None:
    sink = _Sink()
    handle = TaskHandle(id=1)
    embeddings = _MapEmbeddings({"https://dup": [1.0, 0.0], "https://fresh": [0.0, 1.0]})
    _patch(
        monkeypatch,
        fetched=[_raw("https://dup"), _raw("https://fresh")],
        recent=[([1.0, 0.0], "fake")],  # a stored event identical to https://dup's summary
        embeddings=embeddings,
        sink=sink,
        handle=handle,
    )

    await news_ingest.run()

    assert [e.url for e in sink.added] == ["https://fresh"]  # the dup never hit the DB
    assert handle.result.counts.get("deduped_semantic") == 1
    assert handle.result.counts.get("written") == 1


async def test_two_near_identical_events_in_one_run_collapse_to_one(monkeypatch) -> None:
    sink = _Sink()
    handle = TaskHandle(id=1)
    # Both summaries embed to the same vector; nothing stored yet — the second must dedup against
    # the first row accepted *this run* (still unflushed).
    embeddings = _MapEmbeddings({"https://a": [1.0, 0.0], "https://b": [1.0, 0.0]})
    _patch(
        monkeypatch,
        fetched=[_raw("https://a"), _raw("https://b")],
        recent=[],
        embeddings=embeddings,
        sink=sink,
        handle=handle,
    )

    await news_ingest.run()

    assert [e.url for e in sink.added] == ["https://a"]
    assert handle.result.counts.get("deduped_semantic") == 1


async def test_distinct_events_are_both_kept(monkeypatch) -> None:
    sink = _Sink()
    handle = TaskHandle(id=1)
    embeddings = _MapEmbeddings({"https://a": [1.0, 0.0], "https://b": [0.0, 1.0]})
    _patch(
        monkeypatch,
        fetched=[_raw("https://a"), _raw("https://b")],
        recent=[],
        embeddings=embeddings,
        sink=sink,
        handle=handle,
    )

    await news_ingest.run()

    assert {e.url for e in sink.added} == {"https://a", "https://b"}
    assert "deduped_semantic" not in handle.result.counts


# --- orphan macro routing (Feature 2) ----------------------------------------


async def test_orphan_event_routes_to_closest_industry(monkeypatch) -> None:
    sink = _Sink()
    handle = TaskHandle(id=1)
    embeddings = _MapEmbeddings({"https://a": [1.0, 0.0], "https://b": [0.0, 1.0]})
    _patch(
        monkeypatch,
        fetched=[_raw("https://a"), _raw("https://b")],
        recent=[],
        embeddings=embeddings,
        sink=sink,
        handle=handle,
        industries=[(10, [1.0, 0.0], "fake"), (20, [0.0, 1.0], "fake")],
    )

    await news_ingest.run()

    routed = {e.url: e.industry_id for e in sink.added}
    assert routed == {"https://a": 10, "https://b": 20}
    assert handle.result.counts.get("routed") == 2


async def test_below_threshold_orphan_stays_unrouted(monkeypatch) -> None:
    sink = _Sink()
    handle = TaskHandle(id=1)
    # cosine([0.3, 0.95], [1.0, 0.0]) ≈ 0.30 — below ROUTE_SIMILARITY_THRESHOLD (0.45).
    embeddings = _MapEmbeddings({"https://c": [0.3, 0.95]})
    _patch(
        monkeypatch,
        fetched=[_raw("https://c")],
        recent=[],
        embeddings=embeddings,
        sink=sink,
        handle=handle,
        industries=[(10, [1.0, 0.0], "fake")],
    )

    await news_ingest.run()

    assert [e.industry_id for e in sink.added] == [None]
    assert "routed" not in handle.result.counts
