"""Daily research & digest pipeline — the detailed reading list (email + platform).

Orchestrates ingest -> refresh scores -> sector/industry research, then ranks events and
assembles the reading list: the industry sections come back from ``sector_research`` and the
researcher adds the top-of-digest synthesis.

The digest is **not** its own table. The assembled list is written as one ``analysis`` row of
``type=summary`` (``content`` = top snapshot + sections; ``supporting_inputs`` = the cited
news_event ids), which ``/digest/latest`` reads back. The top snapshot is embedded so digests
are searchable. Delivery (email + in-app inbox) goes through the shared ``deliver`` helper.
"""

from __future__ import annotations

from sqlalchemy import select

from app.agents.researcher import TASKS, get_researcher
from app.db.enums import AnalysisType, Channel
from app.db.models.analysis import Analysis
from app.db.models.user import UserPreferences
from app.db.payloads import AnalysisContent, AnalysisSupportingInputs
from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import get_embeddings_provider
from app.tools.delivery import content_hash_for, deliver
from app.tools.registry import TASK_TOP_SNAPSHOT
from app.tools.research import get_news_events
from app.workflows.digest_types import DigestSection
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_DAILY_DIGEST


async def _refresh() -> list[DigestSection]:
    from app.workflows import company_rescore, news_ingest, sector_research

    await news_ingest.run()
    await company_rescore.run()
    return await sector_research.run()


async def _email_address() -> str | None:
    async with readonly_session() as session:
        prefs = (
            await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
        ).scalar_one_or_none()
    return prefs.channels.email if prefs and prefs.channels else None


async def run() -> None:
    embeddings = get_embeddings_provider()
    model_name = TASKS[TASK_TOP_SNAPSHOT].model
    async with run_task(WF_DAILY_DIGEST) as task:
        sections = await _refresh()

        async with readonly_session() as session:
            ranked = await get_news_events(session, limit=200)
        task.count("candidate_events", len(ranked))

        out = await get_researcher().run_task(TASK_TOP_SNAPSHOT, inputs={"ranked": ranked})
        top_snapshot = out.snapshot
        source_event_ids = [e.news_event_id for e in ranked]
        embedded = await embeddings.embed_query(top_snapshot)

        # 1. Persist the digest as an analysis(summary) row — the only durable digest record.
        async with SessionLocal() as session:
            row = Analysis(
                type=AnalysisType.summary,
                content=AnalysisContent(
                    top_snapshot=top_snapshot,
                    sections=[s.model_dump() for s in sections],
                ),
                supporting_inputs=AnalysisSupportingInputs(news_event_ids=source_event_ids),
                model_name=model_name,
                embedding=embedded.vector,
                embedding_model=embedded.model,
            )
            session.add(row)
            await session.commit()
            analysis_id = row.id
        task.count("digest_rows")

        # 2. Deliver: email (if an address is set) + the in-app inbox mirror.
        address = await _email_address()
        body = top_snapshot + "\n\n" + "\n\n".join(f"## {s.section_title}\n{s.snapshot}" for s in sections)
        async with SessionLocal() as session:
            if address:
                await deliver(
                    session,
                    channel=Channel.email,
                    content_hash=content_hash_for("digest", str(analysis_id), "email"),
                    template="digest",
                    ref_type="digest",
                    ref_id=analysis_id,
                    to_addr=address,
                    subject="Daily research digest",
                    body=body,
                )
            await deliver(
                session,
                channel=Channel.in_app,
                content_hash=content_hash_for("digest", str(analysis_id), "in_app"),
                template="digest",
                ref_type="digest",
                ref_id=analysis_id,
            )
