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
autonomous run the findings are promoted to an ``analysis`` row. A completed (or failed) session
is closed and its findings embedded for future retrieval; a session the agent *paused*
(``status="paused"``) stays open so the next autonomous wakeup resumes it — sessions past
``DEEP_RESEARCH_MAX_SESSION_AGE_DAYS`` are force-completed at wakeup so a paused thread never
holds a slot forever.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, or_, select

from app.agents.budget import Budget, remaining_weekly_budget
from app.agents.researcher import TASKS, get_researcher
from app.config import DEEP_RESEARCH_MAX_SESSION_AGE_DAYS, get_settings
from app.db.enums import AnalysisType, StateStatus
from app.db.models.analysis import Analysis
from app.db.models.news import NewsEvent
from app.db.models.state import ResearchState
from app.db.payloads import AnalysisContent, AnalysisSupportingInputs
from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import get_embeddings_provider
from app.tools.registry import TASK_DEEP_RESEARCH
from app.tools.research import search_similar
from app.tools.state import close_research, get_research_state, open_research, update_research
from app.workflows.concurrency import workflow_slot
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


async def _promote(
    state_id: int,
    *,
    answer: str | None,
    findings: str | None,
    open_questions: str | None,
    sources: list[int],
    source_urls: list[str] | None = None,
    model_name: str,
) -> None:
    """Autonomous close: write a session's findings into the durable ``analysis`` record.
    Field arguments so both a submitted output and a stale state row can be promoted.
    ``source_urls`` from a submitted output merge with whatever the session flushed."""
    text = findings or answer or ""
    embeddings = get_embeddings_provider()
    async with SessionLocal() as session:
        state = await get_research_state(session, state_id=state_id)
        embedded = await embeddings.embed_query(text) if text else None
        urls = list(
            dict.fromkeys([*(state.source_urls if state else []), *(source_urls or [])])
        )
        session.add(
            Analysis(
                type=AnalysisType.summary,
                content=AnalysisContent(
                    topic=state.topic if state else None,
                    findings=findings,
                    open_questions=open_questions,
                    answer=answer,
                ),
                supporting_inputs=AnalysisSupportingInputs(
                    news_event_ids=sources,
                    source_refs=urls,
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
    candidates: dict | None = None,
) -> dict:
    """Run one bounded, budget-paced research session.

    ``resume_state_id`` continues an existing session (memory); otherwise a new one is opened
    (subject to the active-session cap). ``initiated_by="user"`` returns the answer without
    auto-promoting; autonomous triggers promote findings on close. ``candidates`` carries the
    material signals of a self-directed session — the agent picks its own focus from them."""
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
            opened = await open_research(
                session, topic=query, parent_state_id=parent_state_id, initiated_by=initiated_by
            )
        state_id, topic = opened.state_id, query
        memory = {"prior_findings": None, "open_questions": None}

    budget = Budget(ceiling=remaining)
    model_name = TASKS[TASK_DEEP_RESEARCH].model
    async with run_task(
        WF_DEEP_RESEARCH,
        params={"query": query, "company_id": company_id, "industry_id": industry_id, "initiated_by": initiated_by, "resumed": resume_state_id is not None},
        state_id=state_id,
    ) as task:
        out = None
        try:
            recalled = await _recall(query)
            inputs = {
                "query": query,
                "topic": topic,
                "state_id": state_id,
                "company_id": company_id,
                "industry_id": industry_id,
                # Budget posture so the agent can self-pace. The user's interests are no longer
                # dumped here — the agent pulls the relevant slice on demand via recall_preferences.
                "budget_remaining": remaining,
                **memory,
                **recalled,
            }
            if candidates is not None:
                inputs["candidates"] = candidates
            out = await get_researcher().run_task(TASK_DEEP_RESEARCH, inputs=inputs, budget=budget)
        finally:
            # Record spend always — effective (cost-weighted) tokens: cache writes at 1.25x,
            # cache reads at 0.1x (see agent._usage_tokens), so tokens_used tracks real cost.
            # Close the session (embedding its findings) on completion or failure — but a
            # *paused* session stays open so the next wakeup resumes it.
            task.tokens = budget.spent
            paused = out is not None and out.status == "paused"
            if not paused:
                async with SessionLocal() as session:
                    await close_research(session, get_embeddings_provider(), state_id=state_id)

        if paused:
            # Total-loss safety net: the resume contract is what the agent flushed, but if it
            # paused without flushing anything, persist the submitted output instead.
            async with SessionLocal() as session:
                state = await get_research_state(session, state_id=state_id)
                if state is not None and not state.findings and (out.findings or out.open_questions):
                    await update_research(
                        session,
                        state_id=state_id,
                        findings=out.findings or None,
                        open_questions=out.open_questions or None,
                        source_ids=out.sources or None,
                        source_urls=out.source_urls or None,
                    )
            task.message("paused")
            return {"blocked": False, "paused": True, "answer": out.answer, "sources": out.sources, "source_urls": out.source_urls, "state_id": state_id}

        if initiated_by != "user":
            await _promote(
                state_id,
                answer=out.answer,
                findings=out.findings,
                open_questions=out.open_questions,
                sources=out.sources,
                source_urls=out.source_urls,
                model_name=model_name,
            )
            task.count("promoted")
        task.message("answered")
        return {"blocked": False, "paused": False, "answer": out.answer, "sources": out.sources, "source_urls": out.source_urls, "state_id": state_id}


async def close_user_session(state_id: int, *, promote: bool = False) -> dict:
    """User-initiated close from the interface: optionally promote flushed findings, then close.

    Open sessions get promote-then-close (mirroring ``_expire_stale_sessions``). An already-closed
    session with ``promote=True`` promotes only — this is how "ask about promotion on close" is
    answered asynchronously from the Research view. Promotion is the workflow's job (per
    ``tools/state.py``), so the API route calls this instead of reaching into the tools."""
    async with readonly_session() as session:
        state = await get_research_state(session, state_id=state_id)
    if state is None:
        return {"found": False, "promoted": False, "closed": False}

    promoted = False
    if promote and (state.findings or state.open_questions):
        await _promote(
            state_id,
            answer=None,
            findings=state.findings,
            open_questions=state.open_questions,
            sources=state.source_ids,
            model_name=TASKS[TASK_DEEP_RESEARCH].model,
        )
        promoted = True

    closed = False
    if state.status == StateStatus.open.value:
        async with SessionLocal() as session:
            await close_research(session, get_embeddings_provider(), state_id=state_id)
        closed = True
    return {"found": True, "promoted": promoted, "closed": closed}


_AUTONOMOUS_QUERY = (
    "Self-directed session: pick the single most material question from `candidates` and research it."
)


async def _candidates() -> dict:
    """Perception: the material signals breadth has surfaced — what is worth researching now."""
    now = datetime.now(timezone.utc)
    async with readonly_session() as session:
        # Events a recent analysis already drew on are covered — don't research them again.
        covered: set[int] = set()
        for si in (
            await session.execute(
                select(Analysis.supporting_inputs).where(
                    Analysis.generated_at >= now - timedelta(days=7)
                )
            )
        ).scalars():
            if si is not None:
                covered.update(si.news_event_ids)
        # Fresh events, plus older events recently *promoted* by the significance recheck —
        # promotion is the only thing that updates a news row, so updated_at is that signal.
        events = (
            await session.execute(
                select(NewsEvent.id, NewsEvent.headline, NewsEvent.significance)
                .where(
                    or_(
                        NewsEvent.published_at >= now - timedelta(hours=24),
                        NewsEvent.updated_at >= now - timedelta(hours=24),
                    )
                )
                .order_by(NewsEvent.significance.desc())
                .limit(10)
            )
        ).all()
        questions = (
            await session.execute(
                select(ResearchState.topic, ResearchState.open_questions)
                .where(ResearchState.status == StateStatus.closed)
                .where(ResearchState.open_questions.is_not(None))
                .order_by(ResearchState.closed_at.desc())
                .limit(5)
            )
        ).all()
    return {
        "significant_events": [
            {"news_event_id": e.id, "headline": e.headline, "significance": e.significance}
            for e in events
            if e.id not in covered
        ],
        "open_questions": [
            {"topic": q.topic, "questions": q.open_questions} for q in questions
        ],
    }


async def _expire_stale_sessions() -> None:
    """Force-complete open sessions past the max age: promote what was flushed, then close.
    Expiry keys on ``opened_at`` deliberately — a session resumed daily refreshes
    ``last_active_at`` forever, and it's exactly that monopoly this breaks."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=DEEP_RESEARCH_MAX_SESSION_AGE_DAYS)
    async with readonly_session() as session:
        stale = list(
            (
                await session.execute(
                    select(ResearchState.id)
                    .where(ResearchState.status == StateStatus.open)
                    .where(ResearchState.opened_at < cutoff)
                )
            ).scalars()
        )
    if not stale:
        return
    model_name = TASKS[TASK_DEEP_RESEARCH].model
    for state_id in stale:
        async with readonly_session() as session:
            state = await get_research_state(session, state_id=state_id)
        if state is not None and state.findings:
            await _promote(
                state_id,
                answer=None,
                findings=state.findings,
                open_questions=state.open_questions,
                sources=state.source_ids,
                model_name=model_name,
            )
        async with SessionLocal() as session:
            await close_research(session, get_embeddings_provider(), state_id=state_id)


async def _oldest_open_session() -> tuple[int, str] | None:
    async with readonly_session() as session:
        row = (
            await session.execute(
                select(ResearchState.id, ResearchState.topic)
                .where(ResearchState.status == StateStatus.open)
                .order_by(ResearchState.opened_at)
                .limit(1)
            )
        ).first()
    return (row.id, row.topic) if row is not None else None


async def run_autonomous() -> dict:
    """The self-directed session — the agent initiates, decides, or rests. Fired by the daily
    schedule or by signal convergence (breadth wrote a material event).

    Resumes the oldest still-open session first (finish what was started); otherwise gathers
    candidates from breadth signal and lets the agent choose its own focus. When nothing is
    material, the researcher rests — per the mental model, it only works when there is something
    worth working on. One autonomous session at a time: a wakeup that arrives while one is
    running is skipped, not queued — the running session already sees the fresh events."""
    async with workflow_slot(WF_DEEP_RESEARCH) as acquired:
        if not acquired:
            return {"skipped": True, "reason": "deep research already running"}

        await _expire_stale_sessions()

        open_row = await _oldest_open_session()
        if open_row is not None:
            state_id, topic = open_row
            return await run(query=topic, initiated_by="schedule", resume_state_id=state_id)

        candidates = await _candidates()
        if not candidates["significant_events"] and not candidates["open_questions"]:
            return {"skipped": True, "reason": "no material signal"}
        return await run(query=_AUTONOMOUS_QUERY, initiated_by="schedule", candidates=candidates)
