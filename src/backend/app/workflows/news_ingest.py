"""News ingest pipeline — pull events, summarize, classify, embed, write, enqueue re-scoring.

The full research surface (not just the watchlist) flows through here. The original article body
is never stored; the AI summary is the canonical record, embedded in the same write as its row.

Events with significance below ``_MIN_SIGNIFICANCE`` are dropped before reaching the DB. Watchlisted
companies named by new events are then enqueued for re-scoring (the event trigger).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from app.agents.researcher import get_researcher
from app.db.enums import CoverageTier
from app.db.models.news import NewsEvent
from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import get_embeddings_provider
from app.providers.news import get_news_provider
from app.tools.registry import TASK_ARTICLE_SUMMARY, TASK_SIGNIFICANCE
from app.tools.research import ScreenFilters, screen_stocks
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


async def _fetch_events() -> list[RawEvent]:
    """Pull raw events for the coverage universe from Finnhub, resolving company_id by ticker."""
    async with readonly_session() as session:
        companies = await screen_stocks(
            session, filters=ScreenFilters(coverage_tier=CoverageTier.watchlist, limit=1000)
        )
    by_ticker = {c.ticker: c for c in companies}
    if not by_ticker:
        return []

    since = datetime.now(timezone.utc) - _LOOKBACK
    items = await get_news_provider().fetch_events(list(by_ticker), since=since)
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
            )
        )
    return events


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
    from app.workflows import company_rescore

    await company_rescore.run(company_ids=sorted(company_ids))


async def run() -> None:
    embeddings = get_embeddings_provider()
    async with run_task(WF_NEWS_INGEST) as task:
        # 1. Pull raw events. — Finnhub
        raw = await _fetch_events()
        task.count("fetched", len(raw))

        touched: set[int] = set()
        async with SessionLocal() as session:
            for event in raw:
                # 2. Summarize + classify. — researcher
                summary_out = await _summarize(event)
                significance = await _classify_significance(event, summary_out.summary)

                # 3. Drop below-threshold events (never stored).
                if significance < _MIN_SIGNIFICANCE:
                    task.count("dropped")
                    continue

                # 4. Embed the summary. — Voyage
                embedded = await embeddings.embed_query(summary_out.summary)

                # 5. Write the event row (summary canonical, embedding carries its model). — write
                session.add(
                    NewsEvent(
                        company_id=event.company_id,
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
                task.count("written")
            await session.commit()

        # 6. Enqueue re-scoring for affected companies. — event trigger
        if touched:
            await _enqueue_rescore(touched)
