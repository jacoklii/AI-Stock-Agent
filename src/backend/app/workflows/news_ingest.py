"""News ingest pipeline — pull events, summarize, classify, embed, write, enqueue re-scoring.

The full research surface (not just the watchlist) flows through here. The original article body
is never stored; the AI summary is the canonical record, embedded in the same write as its row.

Skeleton status: embedding and the ``news_events`` write are real; the provider fetch (Finnhub),
the per-article summary, and the significance classification (agent) are deferred. After writing,
watchlisted companies named by the new events are enqueued for re-scoring (the event trigger).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from app.db.enums import SignificanceTier
from app.db.models.news import NewsEvent
from app.db.session import SessionLocal
from app.providers.embeddings import get_embeddings_provider
from app.workflows.runtime import run_job
from app.workflows.triggers import WF_NEWS_INGEST


@dataclass
class RawEvent:
    """Provider-shaped event before AI processing (fields the fetch will populate)."""

    url: str
    source: str | None
    published_at: datetime
    headline: str
    tickers: list[str] = field(default_factory=list)
    company_id: int | None = None
    industry_id: int | None = None


async def _fetch_events() -> list[RawEvent]:
    """Pull raw events for the coverage universe from the news provider."""
    raise NotImplementedError("TODO(news): Finnhub fetch over coverage universe")


async def _summarize(event: RawEvent) -> str:
    """Researcher condenses the article into the canonical summary (no raw body kept)."""
    raise NotImplementedError("TODO(agent): article_summary")


async def _classify_significance(event: RawEvent, summary: str) -> SignificanceTier:
    """Researcher classifies significance from structural signals."""
    raise NotImplementedError("TODO(agent): significance_classification")


async def _enqueue_rescore(company_ids: set[int]) -> None:
    """Event trigger: enqueue watchlisted companies named by new events for re-scoring."""
    from app.workflows import company_rescore

    await company_rescore.run(company_ids=sorted(company_ids))


async def run() -> None:
    embeddings = get_embeddings_provider()
    async with run_job(WF_NEWS_INGEST) as job:
        # 1. Pull raw events. — TODO(news)
        raw = await _fetch_events()
        job.count("fetched", len(raw))

        touched: set[int] = set()
        async with SessionLocal() as session:
            for event in raw:
                # 2. Summarize + classify. — TODO(agent)
                summary = await _summarize(event)
                tier = await _classify_significance(event, summary)

                # 3. Embed the summary. — real
                embedded = await embeddings.embed_query(summary)

                # 4. Write the event row (summary canonical, embedding carries its model). — real write
                session.add(
                    NewsEvent(
                        company_id=event.company_id,
                        industry_id=event.industry_id,
                        url=event.url,
                        source=event.source,
                        published_at=event.published_at,
                        headline=event.headline,
                        tickers=event.tickers,
                        significance_tier=tier,
                        summary=summary,
                        embedding=embedded.vector,
                        embedding_model=embedded.model,
                    )
                )
                if event.company_id is not None:
                    touched.add(event.company_id)
                job.count("written")
            await session.commit()

        # 5. Enqueue re-scoring for affected companies. — real wiring
        if touched:
            await _enqueue_rescore(touched)
