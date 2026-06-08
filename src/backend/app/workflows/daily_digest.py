"""Daily research & digest pipeline — the detailed reading list (email + platform).

Orchestrates ingest -> refresh scores -> sector/industry research, then ranks events and
assembles the reading list: the industry sections come back from ``sector_research``, and the
researcher adds the top-of-digest synthesis. The assembled list is written to ``digest_runs``
(article refs point into ``news_events`` — content is never duplicated) and delivered by email
+ the in-app inbox.
"""

from __future__ import annotations

import hashlib

from sqlalchemy import select

from app.agents.researcher import get_researcher
from app.db.enums import Channel
from app.db.models.delivery import DigestRun, Notification
from app.db.models.user import UserPreferences
from app.db.payloads import DigestSection
from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import get_embeddings_provider
from app.providers.notifier import get_notifier
from app.tools.registry import TASK_TOP_SNAPSHOT
from app.tools.research import get_news_events, search_similar_events
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_DAILY_DIGEST


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:64]


async def _refresh() -> list[DigestSection]:
    from app.workflows import company_rescore, news_ingest, sector_research

    await news_ingest.run()
    await company_rescore.run()
    return await sector_research.run()


async def _compose_reading_list(
    ranked: list, industry_sections: list[DigestSection]
) -> tuple[str, list[DigestSection], list[int]]:
    out = await get_researcher().run_task(TASK_TOP_SNAPSHOT, inputs={"ranked": ranked})
    source_event_ids = [e.news_event_id for e in ranked]
    return out.snapshot, industry_sections, source_event_ids


async def _email_address() -> str | None:
    async with readonly_session() as session:
        prefs = (
            await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
        ).scalar_one_or_none()
    return prefs.channels.email if prefs and prefs.channels else None


async def _deliver(run_row_id: int, top_snapshot: str, sections: list[DigestSection]) -> None:
    address = await _email_address()
    body = top_snapshot + "\n\n" + "\n\n".join(f"## {s.section_title}\n{s.snapshot}" for s in sections)
    async with SessionLocal() as session:
        if address:
            await get_notifier().send_email(
                to_addr=address, subject="Daily research digest", body=body
            )
            session.add(
                Notification(
                    channel=Channel.email,
                    template="digest",
                    ref_type="digest_run",
                    ref_id=run_row_id,
                    content_hash=_hash(f"digest:{run_row_id}:email"),
                )
            )
        session.add(
            Notification(
                channel=Channel.in_app,
                template="digest",
                ref_type="digest_run",
                ref_id=run_row_id,
                content_hash=_hash(f"digest:{run_row_id}:in_app"),
            )
        )
        await session.commit()


async def run() -> None:
    embeddings = get_embeddings_provider()
    async with run_task(WF_DAILY_DIGEST) as task:
        industry_sections = await _refresh()

        async with readonly_session() as session:
            ranked = await get_news_events(session, limit=200)
            _ = await search_similar_events(session, embeddings, query_text="market", k=50)
        task.count("candidate_events", len(ranked))

        top_snapshot, sections, source_event_ids = await _compose_reading_list(
            ranked, industry_sections
        )

        async with SessionLocal() as session:
            run_row = DigestRun(
                top_snapshot=top_snapshot,
                sections=sections,
                source_event_ids=source_event_ids,
            )
            session.add(run_row)
            await session.commit()
            run_row_id = run_row.id

        await _deliver(run_row_id, top_snapshot, sections)
