"""Daily research & digest pipeline — the detailed reading list (email + platform).

Orchestrates ingest -> refresh scores -> sector research, then ranks events, groups them by
sector/macro, and has the researcher generate section snapshots, per-article summaries, and the
top-of-digest synthesis. The assembled reading list is written to ``reading_list_runs`` (article
refs point into ``news_events`` — content is never duplicated) and delivered by email + in-app.

Skeleton status: the sub-workflow wiring, event ranking, and the ``reading_list_runs`` write are
real; the snapshot/summary/synthesis (agent) and delivery (notifier) are deferred.
"""

from __future__ import annotations

from app.db.models.delivery import ReadingListRun
from app.db.payloads import DigestSection
from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import get_embeddings_provider
from app.tools.research import get_news_events, search_similar_events
from app.workflows.runtime import run_job
from app.workflows.triggers import WF_DAILY_DIGEST


async def _refresh() -> None:
    """Run ingest, re-scoring, and sector research before composing. — real wiring."""
    from app.workflows import company_rescore, news_ingest, sector_research

    await news_ingest.run()
    await company_rescore.run()
    await sector_research.run()


async def _compose_reading_list(ranked: list) -> tuple[str, list[DigestSection], list[int]]:
    """Researcher builds the digest: section snapshots + article summaries + top synthesis.
    Returns (top_snapshot, sections, source_event_ids)."""
    raise NotImplementedError("TODO(agent): section_snapshot + article_summary + top_snapshot")


async def _deliver(run_row: ReadingListRun) -> None:
    """Email the digest and mirror it into the in-app inbox (notification_history)."""
    raise NotImplementedError("TODO(notifier): email digest + mirror in-app")


async def run() -> None:
    embeddings = get_embeddings_provider()
    async with run_job(WF_DAILY_DIGEST) as job:
        # 1. Refresh inputs. — real wiring (cascades into deferred steps)
        await _refresh()

        # 2. Rank + cluster recent significant events. — real
        async with readonly_session() as session:
            ranked = await get_news_events(session, limit=200)
            # similarity clustering seeds the section grouping
            _ = await search_similar_events(session, embeddings, query_text="market", k=50)
        job.count("candidate_events", len(ranked))

        # 3. Compose the digest. — TODO(agent)
        top_snapshot, sections, source_event_ids = await _compose_reading_list(ranked)

        # 4. Persist the reading list. — real write
        async with SessionLocal() as session:
            run_row = ReadingListRun(
                top_snapshot=top_snapshot,
                sections=sections,
                source_event_ids=source_event_ids,
            )
            session.add(run_row)
            await session.commit()

        # 5. Deliver. — TODO(notifier)
        await _deliver(run_row)
