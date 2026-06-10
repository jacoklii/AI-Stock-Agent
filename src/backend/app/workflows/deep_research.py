"""Deep research pipeline — a bounded, autonomous research session.

Triggered on demand (chat/API) or on a schedule. The workflow opens a ``research_state`` row,
hands the researcher a broad tool allowlist (DB reads + web/SEC + cache + the state tools), and
lets it self-pace a multi-step loop — gather, reason, decide what's missing, gather more,
flushing progress to state via ``update_research`` — until it submits a structured answer or hits
the loop bound. The session is then closed.

Two cost/safety stops: at most ``deep_research_max_active`` sessions may be open at once (a 4th
blocks and surfaces), and the agent loop is bounded (``DEEP_RESEARCH_MAX_ITERS``). On an
autonomous run the findings are promoted to an ``analysis`` row; a user-initiated run returns the
answer and leaves promotion to the caller.
"""

from __future__ import annotations

from sqlalchemy import func, select

from app.agents.researcher import TASKS, get_researcher
from app.config import get_settings
from app.db.enums import AnalysisType, StateStatus
from app.db.models.analysis import Analysis
from app.db.models.state import ResearchState
from app.db.payloads import AnalysisContent, AnalysisSupportingInputs
from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import get_embeddings_provider
from app.tools.registry import TASK_DEEP_RESEARCH
from app.tools.state import close_research, get_research_state, open_research
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_DEEP_RESEARCH


async def _active_count() -> int:
    async with readonly_session() as session:
        return (
            await session.execute(
                select(func.count())
                .select_from(ResearchState)
                .where(ResearchState.status == StateStatus.open)
            )
        ).scalar_one()


async def _promote(state_id: int, out, model_name: str) -> None:
    """Autonomous close: write the session's findings into the durable ``analysis`` record."""
    text = out.findings or out.answer or ""
    embeddings = get_embeddings_provider()
    async with SessionLocal() as session:
        state = await get_research_state(session, state_id=state_id)
        embedded = await embeddings.embed_query(text) if text else None
        session.add(
            Analysis(
                type=AnalysisType.summary,
                content=AnalysisContent(
                    topic=state.topic if state else None,
                    findings=out.findings,
                    open_questions=out.open_questions,
                    answer=out.answer,
                ),
                supporting_inputs=AnalysisSupportingInputs(
                    news_event_ids=out.sources,
                    source_refs=state.source_urls if state else [],
                ),
                model_name=model_name,
                embedding=embedded.vector if embedded else None,
                embedding_model=embedded.model if embedded else None,
            )
        )
        await session.commit()


async def run(
    *,
    query: str,
    company_id: int | None = None,
    industry_id: int | None = None,
    initiated_by: str = "schedule",
    parent_state_id: int | None = None,
) -> dict:
    """Run one bounded research session. ``initiated_by`` is ``"user"`` for chat/API requests
    (return the answer, don't auto-promote) or autonomous otherwise (promote on close)."""
    settings = get_settings()
    if await _active_count() >= settings.deep_research_max_active:
        return {"blocked": True, "answer": None, "sources": [], "state_id": None}

    async with SessionLocal() as session:
        state = await open_research(session, topic=query, parent_state_id=parent_state_id)
    state_id = state.state_id

    model_name = TASKS[TASK_DEEP_RESEARCH].model
    async with run_task(
        WF_DEEP_RESEARCH,
        params={"query": query, "company_id": company_id, "industry_id": industry_id, "initiated_by": initiated_by},
        state_id=state_id,
    ) as task:
        try:
            out = await get_researcher().run_task(
                TASK_DEEP_RESEARCH,
                inputs={"query": query, "state_id": state_id, "company_id": company_id, "industry_id": industry_id},
            )
        finally:
            # Close the session even on failure so it never holds an active-research slot open.
            async with SessionLocal() as session:
                await close_research(session, state_id=state_id)

        if initiated_by != "user":
            await _promote(state_id, out, model_name)
            task.count("promoted")
        task.message("answered")
        return {"blocked": False, "answer": out.answer, "sources": out.sources, "state_id": state_id}
