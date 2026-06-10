"""Deep research pipeline — a bounded, autonomous, budget-paced research session.

Triggered on demand (chat/API) or on a schedule. The workflow gives the researcher continuity and
a cost boundary:

- **Memory** — a session either *resumes* an existing ``research_state`` row (reconstructing topic,
  findings, open questions, sources) or opens a new one, and in both cases seeds the agent with
  *findings-first* semantic retrieval over prior ``analysis`` and past sessions (``search_similar``).
- **Self-pacing** — it computes the remaining weekly token budget and passes it as a ceiling to the
  agent loop; an already-exhausted budget blocks the run, and tokens spent are recorded on the
  ``tasks`` row.

Other stops: ≤ ``deep_research_max_active`` open sessions, and the bounded agent loop. On an
autonomous run the findings are promoted to an ``analysis`` row; the session is closed (and its
findings embedded for future retrieval) even on failure, so it never holds a slot or budget open.
"""

from __future__ import annotations

from sqlalchemy import func, select

from app.agents.budget import Budget, remaining_weekly_budget
from app.agents.researcher import TASKS, get_researcher
from app.config import get_settings
from app.db.enums import AnalysisType, StateStatus
from app.db.models.analysis import Analysis
from app.db.models.state import ResearchState
from app.db.payloads import AnalysisContent, AnalysisSupportingInputs
from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import get_embeddings_provider
from app.tools.registry import TASK_DEEP_RESEARCH
from app.tools.research import search_similar
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


async def _recall(query: str) -> dict:
    """Findings-first retrieval: what we already know about this query (long-term memory)."""
    embeddings = get_embeddings_provider()
    async with readonly_session() as session:
        known_analysis = await search_similar(session, embeddings, query_text=query, scope="analysis", k=5)
        related_sessions = await search_similar(session, embeddings, query_text=query, scope="state", k=3)
    return {"known_analysis": known_analysis, "related_sessions": related_sessions}


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
    resume_state_id: int | None = None,
) -> dict:
    """Run one bounded, budget-paced research session.

    ``resume_state_id`` continues an existing session (memory); otherwise a new one is opened
    (subject to the active-session cap). ``initiated_by="user"`` returns the answer without
    auto-promoting; autonomous triggers promote findings on close."""
    settings = get_settings()

    # Budget gate (self-pacing): decline before spending anything if the weekly budget is spent.
    async with readonly_session() as session:
        remaining = await remaining_weekly_budget(session)
    if remaining is not None and remaining <= 0:
        return {"blocked": True, "reason": "weekly token budget exhausted", "answer": None, "sources": [], "state_id": None}

    # Resume an existing session, or open a new one (capped).
    if resume_state_id is not None:
        async with readonly_session() as session:
            prior = await get_research_state(session, state_id=resume_state_id)
        if prior is None:
            return {"blocked": True, "reason": "research session not found", "answer": None, "sources": [], "state_id": None}
        state_id, topic = prior.state_id, prior.topic
        memory = {"prior_findings": prior.findings, "open_questions": prior.open_questions}
    else:
        if await _active_count() >= settings.deep_research_max_active:
            return {"blocked": True, "reason": "max active research sessions reached", "answer": None, "sources": [], "state_id": None}
        async with SessionLocal() as session:
            opened = await open_research(session, topic=query, parent_state_id=parent_state_id)
        state_id, topic = opened.state_id, query
        memory = {"prior_findings": None, "open_questions": None}

    budget = Budget(ceiling=remaining)
    model_name = TASKS[TASK_DEEP_RESEARCH].model
    async with run_task(
        WF_DEEP_RESEARCH,
        params={"query": query, "company_id": company_id, "industry_id": industry_id, "initiated_by": initiated_by, "resumed": resume_state_id is not None},
        state_id=state_id,
    ) as task:
        try:
            recalled = await _recall(query)
            out = await get_researcher().run_task(
                TASK_DEEP_RESEARCH,
                inputs={
                    "query": query,
                    "topic": topic,
                    "state_id": state_id,
                    "company_id": company_id,
                    "industry_id": industry_id,
                    **memory,
                    **recalled,
                },
                budget=budget,
            )
        finally:
            # Record spend and close the session (embedding its findings) even on failure.
            task.tokens = budget.spent
            async with SessionLocal() as session:
                await close_research(session, get_embeddings_provider(), state_id=state_id)

        if initiated_by != "user":
            await _promote(state_id, out, model_name)
            task.count("promoted")
        task.message("answered")
        return {"blocked": False, "answer": out.answer, "sources": out.sources, "state_id": state_id}
