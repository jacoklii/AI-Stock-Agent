"""Prose regeneration pipeline — sparse AI read, written only on a genuine shift.

Threshold-triggered by a score shift (from ``company_rescore``). The score shift already proved
the *inputs* moved; this pipeline then writes prose ONLY when the *new read itself* differs
meaningfully from the prior row. Following the architecture, that check is on the **generated**
prose: the researcher writes the read, it is embedded, and ``analysis.prose_changed`` compares it
against the previous prose's embedding (cosine). Prose connects dots; it is never a decision or a
valuation call. Each prose row's sources are recorded in ``citations`` in the same transaction.
"""

from __future__ import annotations

from sqlalchemy import select

from app.agents.researcher import TASKS, get_researcher
from app.analysis import prose_changed
from app.db.enums import ProseKind
from app.db.models.analysis import Citation, FundamentalProse, SentimentalProse
from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import get_embeddings_provider
from app.tools.analysis import get_latest_prose, get_latest_scores
from app.tools.registry import TASK_COMPANY_PROSE
from app.tools.research import get_news_events, search_similar_events
from app.workflows.concurrency import company_lock
from app.workflows.runtime import run_job
from app.workflows.triggers import WF_PROSE_REGEN

_PROSE_MODEL = {ProseKind.fundamental: FundamentalProse, ProseKind.sentimental: SentimentalProse}


async def _previous_embedding(company_id: int, kind: ProseKind) -> list[float] | None:
    """The previous prose row's stored embedding (for the change-detection compare)."""
    model = _PROSE_MODEL[kind]
    async with readonly_session() as session:
        stmt = (
            select(model.embedding)
            .where(model.company_id == company_id)
            .order_by(model.generated_at.desc())
            .limit(1)
        )
        return (await session.execute(stmt)).scalars().first()


async def _generate_prose(kind: ProseKind, context: dict):
    """Researcher writes the company read; returns CompanyProseOut (body + cited event ids)."""
    return await get_researcher().run_task(TASK_COMPANY_PROSE, inputs={"kind": kind.value, **context})


async def run(*, company_id: int, kind: ProseKind) -> None:
    embeddings = get_embeddings_provider()
    model_name = TASKS[TASK_COMPANY_PROSE].model
    async with run_job(WF_PROSE_REGEN, params={"company_id": company_id, "kind": kind.value}) as job:
        async with company_lock(company_id):
            # 1. Gather context. — read tools
            async with readonly_session() as session:
                context = {
                    "scores": await get_latest_scores(session, company_id=company_id),
                    "news": await get_news_events(session, company_id=company_id, limit=30),
                    "similar": await search_similar_events(
                        session, embeddings, query_text=f"company {company_id} {kind.value}", k=10
                    ),
                    "previous": await get_latest_prose(session, company_id=company_id, kind=kind),
                }
            prev_vec = await _previous_embedding(company_id, kind)

            # 2. Generate the read. — researcher
            generated = await _generate_prose(kind, context)

            # 3. Embed it, then keep it ONLY if it materially differs from the prior read. — analysis/
            embedded = await embeddings.embed_query(generated.body)
            if not prose_changed(embedded.vector, prev_vec):
                job.message("no material change; prose unchanged")
                return

            # 4. Write prose + citations together. — write (sparse by design)
            async with SessionLocal() as session:
                prose = _PROSE_MODEL[kind](
                    company_id=company_id,
                    body=generated.body,
                    model_name=model_name,
                    embedding=embedded.vector,
                    embedding_model=embedded.model,
                )
                session.add(prose)
                await session.flush()
                for news_event_id in generated.citation_event_ids:
                    session.add(
                        Citation(prose_kind=kind, prose_id=prose.id, news_event_id=news_event_id)
                    )
                await session.commit()
            job.count("prose_rows")
