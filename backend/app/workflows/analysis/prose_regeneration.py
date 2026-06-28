"""Prose regeneration pipeline — sparse AI read, written only on a genuine shift.

Threshold-triggered by a score shift (from ``company_rescore``). The score shift already proved
the *inputs* moved; this pipeline then writes prose ONLY when the *new read itself* differs
meaningfully from the prior row. Following the architecture, that check is on the **generated**
prose: the researcher writes the read, it is embedded, and ``analysis.prose_changed`` compares it
against the previous prose's embedding (cosine). Prose connects dots; it is never a decision or a
valuation call. Each prose row's sources are recorded in ``supporting_inputs`` in the same write.
"""

from __future__ import annotations

from sqlalchemy import select

from app.agents.researcher import TASKS, get_researcher
from app.analysis import prose_changed
from app.db.models.analysis import Fundamental, Sentimental
from app.db.payloads import AnalysisSupportingInputs
from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import get_embeddings_provider
from app.tools.analysis import get_latest_prose, get_latest_scores
from app.tools.registry import TASK_COMPANY_PROSE
from app.tools.research import get_news_events
from app.workflows.concurrency import company_lock
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_PROSE_REGEN

_PROSE_MODEL = {"fundamental": Fundamental, "sentimental": Sentimental}


async def _previous_prose_embedding(company_id: int, kind: str) -> list[float] | None:
    """Most recent stored embedding from a row that has prose (for change-detection)."""
    model = _PROSE_MODEL[kind]
    async with readonly_session() as session:
        stmt = (
            select(model.embedding)
            .where(model.company_id == company_id)
            .where(model.prose.isnot(None))
            .order_by(model.generated_at.desc())
            .limit(1)
        )
        return (await session.execute(stmt)).scalars().first()


async def _latest_score_row(company_id: int, kind: str):
    """Most recent score row — used to copy scores into the new prose-bearing row."""
    model = _PROSE_MODEL[kind]
    async with readonly_session() as session:
        stmt = (
            select(model)
            .where(model.company_id == company_id)
            .order_by(model.generated_at.desc())
            .limit(1)
        )
        return (await session.execute(stmt)).scalars().first()


async def _generate_prose(kind: str, context: dict):
    """Researcher writes the company read; returns CompanyProseOut (body + cited event ids)."""
    return await get_researcher().run_task(TASK_COMPANY_PROSE, inputs={"kind": kind, **context})


async def run(*, company_id: int, kind: str) -> None:
    embeddings = get_embeddings_provider()
    model_name = TASKS[TASK_COMPANY_PROSE].model
    async with run_task(WF_PROSE_REGEN, params={"company_id": company_id, "kind": kind}) as task:
        async with company_lock(company_id):
            # 1. Gather context. — read tools
            async with readonly_session() as session:
                context = {
                    "scores": await get_latest_scores(session, company_id=company_id),
                    "news": await get_news_events(session, company_id=company_id, limit=30),
                    "previous": await get_latest_prose(session, company_id=company_id, kind=kind),
                }
            prior_row = await _latest_score_row(company_id, kind)
            prev_vec = await _previous_prose_embedding(company_id, kind)

            # 2. Generate the read. — researcher
            generated = await _generate_prose(kind, context)

            # 3. Embed it, then keep it ONLY if it materially differs from the prior read.
            embedded = await embeddings.embed_query(generated.body)
            if not prose_changed(embedded.vector, prev_vec):
                task.message("no material change; prose unchanged")
                return

            # 4. Write a new row combining scores + prose (sparse by design).
            async with SessionLocal() as session:
                model = _PROSE_MODEL[kind]
                row = model(
                    company_id=company_id,
                    scores=prior_row.scores if prior_row else None,
                    score=prior_row.score if prior_row else 0.0,
                    rubric_version=prior_row.rubric_version if prior_row else "unknown",
                    prose=generated.body,
                    model_name=model_name,
                    embedding=embedded.vector,
                    embedding_model=embedded.model,
                    supporting_inputs=AnalysisSupportingInputs(
                        news_event_ids=generated.citation_event_ids
                    ),
                )
                session.add(row)
                await session.commit()
            task.count("prose_rows")
