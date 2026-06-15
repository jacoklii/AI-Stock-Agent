"""News ingest pipeline — pull events, dedupe, summarize, classify, embed, write, enqueue re-scoring.

The full research surface (not just the watchlist) flows through here. The original article body
is never stored; the AI summary is the canonical record, embedded in the same write as its row.

Runs hourly (and inline from the daily digest) — already-stored URLs are skipped before any AI
spend, and a ``workflow_slot`` guard keeps concurrent runs from racing. Events with significance
below ``_MIN_SIGNIFICANCE`` are dropped before reaching the DB. Watchlisted companies named by new
events are enqueued for re-scoring (the event trigger), and an event at or above
``DEEP_RESEARCH_WAKEUP_SIGNIFICANCE`` wakes the autonomous researcher (signal convergence).
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.agents.researcher import get_researcher
from app.config import (
    DEDUP_LOOKBACK_DAYS,
    DEDUP_SIMILARITY_THRESHOLD,
    DEEP_RESEARCH_WAKEUP_SIGNIFICANCE,
    ROUTE_SIMILARITY_THRESHOLD,
)
from app.db.enums import CoverageTier
from app.db.models.companies import Industry
from app.db.models.news import NewsEvent
from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import get_embeddings_provider
from app.providers.news import get_news_provider
from app.tools.registry import TASK_ARTICLE_SUMMARY, TASK_SIGNIFICANCE
from app.tools.research import ScreenFilters, screen_stocks
from app.workflows.concurrency import workflow_slot
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_NEWS_INGEST

# How far back to pull on a routine ingest run.
_LOOKBACK = timedelta(days=1)

# Events classified below this significance floor are discarded — never stored.
_MIN_SIGNIFICANCE = 0.15


@dataclass
class RawEvent:
    """Provider-shaped event before AI processing (fields the fetch populates)."""

    url: str
    source: str | None
    published_at: datetime
    headline: str
    tickers: list[str] = field(default_factory=list)
    company_id: int | None = None
    # Set from the matched company's industry (free); orphan items are routed by embedding later.
    industry_id: int | None = None


async def _fetch_events() -> list[RawEvent]:
    """Pull the general/macro feed plus per-symbol news for the watchlist.

    Breadth watches the whole market: the general feed always flows (even with an empty
    watchlist) and significance classification separates signal from noise downstream. The
    per-symbol depth fetch stays watchlist-only — the deliberate cost boundary. ``company_id``
    resolves against every tracked company (any active tier), so a macro item naming a
    discovered mega-cap still lands on its page."""
    async with readonly_session() as session:
        tracked = await screen_stocks(session, filters=ScreenFilters(limit=1000))
    tracked = [c for c in tracked if c.coverage_tier is not CoverageTier.archived]
    by_ticker = {c.ticker: c for c in tracked}
    watchlist = [c.ticker for c in tracked if c.coverage_tier is CoverageTier.watchlist]

    since = datetime.now(timezone.utc) - _LOOKBACK
    provider = get_news_provider()
    items = await provider.fetch_general_news(since=since)
    if watchlist:
        items += await provider.fetch_events(watchlist, since=since)

    events: list[RawEvent] = []
    for item in items:
        primary = item.tickers[0] if item.tickers else None
        company = by_ticker.get(primary) if primary else None
        events.append(
            RawEvent(
                url=item.url,
                source=item.source,
                published_at=item.published_at,
                headline=item.headline,
                tickers=item.tickers,
                company_id=company.company_id if company else None,
                industry_id=company.industry_id if company else None,
            )
        )
    return events


# Headline normalization for the lexical dedup gate: lowercase, then collapse every run of
# non-alphanumerics (punctuation, whitespace) to a single space. The same story rewritten with
# different punctuation/casing across outlets normalizes to the same key.
_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def _norm_headline(headline: str) -> str:
    return _NON_ALNUM.sub(" ", headline.casefold()).strip()


def _cosine(a: list[float], b: list[float]) -> float:
    """Plain cosine similarity. Mirrors pgvector's ``cosine_distance`` (1 - this) so the in-Python
    gate and the SQL semantic-search tools rank the same way."""
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (na * nb)


def _max_similarity(
    vector: list[float], model: str, pool: list[tuple[list[float], str]]
) -> float:
    """Top-1 cosine of ``vector`` against every same-model embedding in ``pool`` (0.0 if none)."""
    best = 0.0
    for vec, mdl in pool:
        if mdl == model:
            best = max(best, _cosine(vector, vec))
    return best


def _dedupe_batch(events: list[RawEvent]) -> list[RawEvent]:
    """Drop in-batch repeats before any AI spend, keeping the first occurrence. Catches both URL
    repeats (the per-symbol fetch returns one article per related ticker) and the same story under
    one URL but reprinted by several outlets (matched on the normalized headline)."""
    seen_urls: set[str] = set()
    seen_headlines: set[str] = set()
    unique: list[RawEvent] = []
    for event in events:
        key = _norm_headline(event.headline)
        if event.url in seen_urls or (key and key in seen_headlines):
            continue
        seen_urls.add(event.url)
        if key:
            seen_headlines.add(key)
        unique.append(event)
    return unique


async def _existing_urls(urls: list[str]) -> set[str]:
    """URLs already stored — re-ingest skips them before any AI spend."""
    if not urls:
        return set()
    async with readonly_session() as session:
        rows = await session.execute(select(NewsEvent.url).where(NewsEvent.url.in_(urls)))
        return set(rows.scalars())


async def _existing_headlines() -> set[str]:
    """Normalized headlines of recently-stored events — the lexical gate against the DB. Bounded to
    the dedup window so the same story re-crawled within a few days is dropped before AI spend, but
    a genuinely recurring topic weeks later is not."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=DEDUP_LOOKBACK_DAYS)
    async with readonly_session() as session:
        rows = await session.execute(
            select(NewsEvent.headline).where(NewsEvent.published_at >= cutoff)
        )
        return {_norm_headline(h) for h in rows.scalars() if h and _norm_headline(h)}


async def _recent_embeddings() -> list[tuple[list[float], str]]:
    """Recent stored summary embeddings (vector, model) for the semantic dedup gate — reused for
    every candidate this run, so the cosine scan is in memory, not a query per event."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=DEDUP_LOOKBACK_DAYS)
    async with readonly_session() as session:
        rows = await session.execute(
            select(NewsEvent.embedding, NewsEvent.embedding_model)
            .where(NewsEvent.embedding.is_not(None))
            .where(NewsEvent.published_at >= cutoff)
        )
        return [(list(vec), model) for vec, model in rows.all()]


async def _industry_embeddings() -> list[tuple[int, list[float], str]]:
    """Active industries with an embedding (id, vector, model) — the routing targets for orphan
    macro news. Loaded once per run; empty until the boot backfill has embedded them."""
    async with readonly_session() as session:
        rows = await session.execute(
            select(Industry.id, Industry.embedding, Industry.embedding_model)
            .where(Industry.is_active.is_(True))
            .where(Industry.embedding.is_not(None))
        )
        return [(ind_id, list(vec), model) for ind_id, vec, model in rows.all()]


def _route_industry(
    vector: list[float], model: str, industries: list[tuple[int, list[float], str]]
) -> int | None:
    """The closest industry by cosine, or ``None`` if nothing clears ``ROUTE_SIMILARITY_THRESHOLD``
    (better unrouted than forced into a poor fit). Only same-model embeddings are comparable."""
    best_id: int | None = None
    best_sim = ROUTE_SIMILARITY_THRESHOLD
    for ind_id, vec, mdl in industries:
        if mdl != model:
            continue
        sim = _cosine(vector, vec)
        if sim >= best_sim:
            best_sim = sim
            best_id = ind_id
    return best_id


async def _summarize(event: RawEvent):
    """Researcher condenses the article into the canonical summary."""
    return await get_researcher().run_task(TASK_ARTICLE_SUMMARY, inputs={"event": event})


async def _classify_significance(event: RawEvent, summary: str) -> float:
    """Researcher classifies significance (0-1) from the event and its summary."""
    out = await get_researcher().run_task(
        TASK_SIGNIFICANCE, inputs={"event": event, "summary": summary}
    )
    return out.significance


async def _enqueue_rescore(company_ids: set[int]) -> None:
    """Event trigger: enqueue watchlisted companies named by new events for re-scoring."""
    from app.workflows.analysis import company_rescore

    await company_rescore.run(company_ids=sorted(company_ids))


async def _wakeup_deep_research() -> dict:
    """Signal-convergence trigger: breadth surfaced a material event — call the researcher back."""
    from app.workflows.research import deep_research

    return await deep_research.run_autonomous()


async def run() -> None:
    # One ingest at a time: the hourly job and the digest's inline call would otherwise race
    # past the URL dedup and collide on the unique constraint. Skips write no task row; the
    # concurrent run does the same work.
    async with workflow_slot(WF_NEWS_INGEST) as acquired:
        if not acquired:
            return

        embeddings = get_embeddings_provider()
        async with run_task(WF_NEWS_INGEST) as task:
            # 1. Pull raw events, then run the lexical dedup gate (in-batch + already-stored URLs and
            #    normalized headlines) before any AI spend.
            raw = await _fetch_events()
            task.count("fetched", len(raw))
            unique = _dedupe_batch(raw)
            known_urls = await _existing_urls([e.url for e in unique])
            known_headlines = await _existing_headlines()
            events = [
                e
                for e in unique
                if e.url not in known_urls and _norm_headline(e.headline) not in known_headlines
            ]
            task.count("deduped", len(raw) - len(events))

            # Semantic dedup gate state: recent stored vectors (loaded once) plus the vectors of
            # rows accepted this run (still unflushed). The same story rewritten by another outlet
            # has a near-identical summary even when URL and headline differ.
            recent_vectors = await _recent_embeddings()
            accepted_vectors: list[tuple[list[float], str]] = []

            # Routing targets: industry embeddings, loaded once. Orphan macro items (no company) are
            # routed to their closest industry by the same summary embedding — no LLM, no extra embed.
            industry_vectors = await _industry_embeddings()

            touched: set[int] = set()
            wake = False
            async with SessionLocal() as session:
                for event in events:
                    # 2. Summarize + classify. — researcher
                    summary_out = await _summarize(event)
                    significance = await _classify_significance(event, summary_out.summary)

                    # 3. Drop below-threshold events (never stored) — and never embed sub-floor
                    #    noise, protecting the Voyage budget.
                    if significance < _MIN_SIGNIFICANCE:
                        task.count("dropped")
                        continue

                    # 4. Embed the summary. — Voyage
                    embedded = await embeddings.embed_query(summary_out.summary)

                    # 4b. Semantic dedup gate: top-1 cosine over recent + this-run vectors. A
                    #     near-duplicate is dropped (counted, not written) so downstream synthesis
                    #     pays no tokens for it. Reuses the embedding already computed — no extra call.
                    similarity = max(
                        _max_similarity(embedded.vector, embedded.model, recent_vectors),
                        _max_similarity(embedded.vector, embedded.model, accepted_vectors),
                    )
                    if similarity >= DEDUP_SIMILARITY_THRESHOLD:
                        task.count("deduped_semantic")
                        continue
                    accepted_vectors.append((embedded.vector, embedded.model))

                    # 4c. Give the event an industry home. A company match inherits the company's
                    #     industry for free; an orphan macro item is routed by embedding similarity.
                    industry_id = event.industry_id
                    if industry_id is None and event.company_id is None:
                        industry_id = _route_industry(
                            embedded.vector, embedded.model, industry_vectors
                        )
                        if industry_id is not None:
                            task.count("routed")

                    # 5. Write the event row (summary canonical, embedding carries its model). — write
                    session.add(
                        NewsEvent(
                            company_id=event.company_id,
                            industry_id=industry_id,
                            url=event.url,
                            source=event.source,
                            published_at=event.published_at,
                            headline=event.headline,
                            tickers=event.tickers,
                            significance=significance,
                            summary=summary_out.summary,
                            embedding=embedded.vector,
                            embedding_model=embedded.model,
                        )
                    )
                    if event.company_id is not None:
                        touched.add(event.company_id)
                    if significance >= DEEP_RESEARCH_WAKEUP_SIGNIFICANCE:
                        wake = True
                    task.count("written")
                await session.commit()

            # 6. Enqueue re-scoring for affected companies. — event trigger
            if touched:
                await _enqueue_rescore(touched)

            # 7. A material event clears the wakeup bar: call the researcher back, after the
            #    re-score so the session sees fresh scores. — signal-convergence trigger
            if wake:
                await _wakeup_deep_research()
                task.count("wakeup")
