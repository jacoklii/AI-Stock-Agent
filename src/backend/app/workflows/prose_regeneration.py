"""Prose regeneration pipeline — sparse AI read, written only on a genuine shift.

Threshold-triggered by a score shift (from ``company_rescore``). Prose is written ONLY when the
new read differs meaningfully from the prior row (embedding-similarity check), so the table stays
sparse. Prose connects dots; it is never a decision or valuation call. Each prose row's sources
are recorded in ``citations``, written in the same transaction.

Skeleton status: context gathering, the embedding, and the prose+citations write are real; the
change detection (``analysis/``) and the prose generation (agent) are deferred.
"""

from __future__ import annotations

from app.db.enums import ProseKind
from app.db.models.analysis import Citation, FundamentalProse, SentimentalProse
from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import get_embeddings_provider
from app.tools.analysis import get_latest_prose, get_latest_scores
from app.tools.research import get_news_events, search_similar_events
from app.workflows.concurrency import company_lock
from app.workflows.runtime import run_job
from app.workflows.triggers import WF_PROSE_REGEN

_PROSE_MODEL = {ProseKind.fundamental: FundamentalProse, ProseKind.sentimental: SentimentalProse}


async def _read_changed(context: dict, previous_body: str | None) -> bool:
    """Whether the new read differs enough from the previous prose to warrant a new row."""
    raise NotImplementedError("TODO(scoring): prose-change detection (embedding similarity)")


async def _generate_prose(kind: ProseKind, context: dict) -> tuple[str, str, list[int]]:
    """Researcher writes the prose; returns (body, model_name, cited news_event_ids)."""
    raise NotImplementedError(f"TODO(agent): {kind.value} company_prose")


async def run(*, company_id: int, kind: ProseKind) -> None:
    embeddings = get_embeddings_provider()
    async with run_job(WF_PROSE_REGEN, params={"company_id": company_id, "kind": kind.value}) as job:
        async with company_lock(company_id):
            # 1. Gather context. — real
            async with readonly_session() as session:
                previous = await get_latest_prose(session, company_id=company_id, kind=kind)
                context = {
                    "scores": await get_latest_scores(session, company_id=company_id),
                    "news": await get_news_events(session, company_id=company_id, limit=30),
                    "similar": await search_similar_events(
                        session, embeddings, query_text=f"company {company_id} {kind.value}", k=10
                    ),
                    "previous": previous,
                }

            # 2. Only proceed on a material change. — TODO(scoring)
            if not await _read_changed(context, previous.body if previous else None):
                job.message("no material change; prose unchanged")
                return

            # 3. Generate prose. — TODO(agent)
            body, model_name, cited_ids = await _generate_prose(kind, context)

            # 4. Embed it. — real
            embedded = await embeddings.embed_query(body)

            # 5. Write prose + citations together. — real write
            async with SessionLocal() as session:
                prose = _PROSE_MODEL[kind](
                    company_id=company_id,
                    body=body,
                    model_name=model_name,
                    embedding=embedded.vector,
                    embedding_model=embedded.model,
                )
                session.add(prose)
                await session.flush()
                for news_event_id in cited_ids:
                    session.add(
                        Citation(prose_kind=kind, prose_id=prose.id, news_event_id=news_event_id)
                    )
                await session.commit()
            job.count("prose_rows")
