"""Research sessions — the interface onto the agent's deep work.

List/detail read the ``research_state`` ledger directly (display surface, read-only session).
Opening a session does the cheap gates synchronously (budget, active cap), opens the state row,
and returns ``202`` with the ``state_id`` while the session runs as a background asyncio task —
progress is observable through the ``tasks`` ledger and the state row itself, so the UI polls
instead of holding the request open. Close/redirect are the user's direction levers.

Restart semantics: if the process dies mid-run the asyncio task dies with it; the boot sweep
fails the orphaned ``tasks`` row, the state row stays open, and the next autonomous wakeup
resumes it (as a schedule-initiated session, so finished work is promoted rather than lost).
"""

from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.budget import remaining_weekly_budget
from app.api.deps import ro_session, rw_session
from app.api.schemas import (
    ArticleOut,
    FollowupRequest,
    FollowupResponse,
    ResearchCloseRequest,
    ResearchCloseResponse,
    ResearchOpenRequest,
    ResearchOpenResponse,
    ResearchRedirectRequest,
    ResearchSessionDetail,
    ResearchSessionOut,
    TaskOut,
)
from app.config import get_settings
from app.db.enums import StateStatus
from app.db.models.news import NewsEvent
from app.db.models.state import ResearchState
from app.db.models.tasks import Task
from app.db.payloads import StateSources
from app.db.session import SessionLocal
from app.tools.state import open_research
from app.workflows.research import deep_research
from app.workflows.research import followup as followup_wf

router = APIRouter(tags=["research"])

# Keep-alive set for fire-and-forget session runs (asyncio only holds weak refs).
_BACKGROUND_TASKS: set[asyncio.Task] = set()


def _spawn(coro) -> None:
    task = asyncio.create_task(coro)
    _BACKGROUND_TASKS.add(task)
    task.add_done_callback(_BACKGROUND_TASKS.discard)


def _session_out(row: ResearchState) -> ResearchSessionOut:
    return ResearchSessionOut(
        state_id=row.id,
        topic=row.topic,
        status=row.status.value,
        current_task=row.current_task,
        findings=row.findings,
        open_questions=row.open_questions,
        opened_at=row.opened_at,
        last_active_at=row.last_active_at,
        closed_at=row.closed_at,
        parent_state_id=row.parent_state_id,
    )


def _task_out(row: Task) -> TaskOut:
    return TaskOut(
        id=row.id,
        type=row.type,
        status=row.status.value,
        started_at=row.started_at,
        completed_at=row.completed_at,
        error_message=row.error_message,
        tokens_used=row.tokens_used,
        state_id=row.state_id,
        message=row.result_summary.message if row.result_summary else None,
        counts=dict(row.result_summary.counts) if row.result_summary else {},
    )


@router.get("/research", response_model=list[ResearchSessionOut])
async def list_sessions(
    status: StateStatus | None = None,
    limit: int = 20,
    session: AsyncSession = Depends(ro_session),
) -> list[ResearchSessionOut]:
    """Research sessions, most recently active first."""
    stmt = (
        select(ResearchState)
        .order_by(ResearchState.last_active_at.desc())
        .limit(min(limit, 100))
    )
    if status is not None:
        stmt = stmt.where(ResearchState.status == status)
    rows = (await session.execute(stmt)).scalars()
    return [_session_out(r) for r in rows]


@router.get("/research/{state_id}", response_model=ResearchSessionDetail)
async def session_detail(
    state_id: int, session: AsyncSession = Depends(ro_session)
) -> ResearchSessionDetail:
    """One session with its task trail and the source articles it has consulted."""
    row = (
        await session.execute(select(ResearchState).where(ResearchState.id == state_id))
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="research session not found")

    tasks = (
        await session.execute(
            select(Task).where(Task.state_id == state_id).order_by(Task.id.desc()).limit(20)
        )
    ).scalars()

    sources = row.sources or StateSources()
    articles: list[ArticleOut] = []
    if sources.source_ids:
        events = (
            await session.execute(select(NewsEvent).where(NewsEvent.id.in_(sources.source_ids)))
        ).scalars()
        articles = [
            ArticleOut(
                news_event_id=e.id,
                url=e.url,
                source=e.source,
                published_at=e.published_at,
                headline=e.headline,
                summary=e.summary,
                significance=e.significance,
                tickers=list(e.tickers),
            )
            for e in events
        ]

    base = _session_out(row)
    return ResearchSessionDetail(
        **base.model_dump(),
        source_articles=articles,
        source_urls=list(sources.urls),
        tasks=[_task_out(t) for t in tasks],
    )


async def _run_user_session(state_id: int, body: ResearchOpenRequest) -> None:
    """Background runner for a user-opened session.

    A user run returns its answer to nobody (the 202 already went out), so if the agent completed
    without flushing findings, persist the answer onto the (closed) state row — mirrors the
    pause safety net in the workflow. ``update_research`` doesn't check status, so this works."""
    from app.tools.state import get_research_state, update_research

    result = await deep_research.run(
        query=body.topic,
        company_id=body.company_id,
        industry_id=body.industry_id,
        initiated_by="user",
        resume_state_id=state_id,
    )
    if result.get("blocked") or result.get("paused") or not result.get("answer"):
        return
    async with SessionLocal() as session:
        state = await get_research_state(session, state_id=state_id)
        if state is not None and not state.findings:
            await update_research(
                session,
                state_id=state_id,
                findings=result["answer"],
                source_ids=result.get("sources") or None,
            )


@router.post("/research", response_model=ResearchOpenResponse, status_code=202)
async def open_session(
    body: ResearchOpenRequest, session: AsyncSession = Depends(rw_session)
) -> ResearchOpenResponse:
    """Open a research session and run it in the background (202 + state_id to poll).

    Gates are checked synchronously so a blocked request fails loudly here instead of silently
    in the background: 409 when the weekly budget is exhausted or the active-session cap is hit.
    """
    remaining = await remaining_weekly_budget(session)
    if remaining is not None and remaining <= 0:
        raise HTTPException(status_code=409, detail="weekly token budget exhausted")

    active = (
        await session.execute(
            select(func.count())
            .select_from(ResearchState)
            .where(ResearchState.status == StateStatus.open)
        )
    ).scalar_one()
    if active >= get_settings().deep_research_max_active:
        raise HTTPException(status_code=409, detail="max active research sessions reached")

    opened = await open_research(session, topic=body.topic)
    _spawn(_run_user_session(opened.state_id, body))
    return ResearchOpenResponse(state_id=opened.state_id)


@router.post("/research/{state_id}/close", response_model=ResearchCloseResponse)
async def close_session(state_id: int, body: ResearchCloseRequest) -> ResearchCloseResponse:
    """Close a session, optionally promoting its findings to the durable analysis record.

    Also answers the promotion question for an already-closed session (promote-only)."""
    result = await deep_research.close_user_session(state_id, promote=body.promote)
    if not result["found"]:
        raise HTTPException(status_code=404, detail="research session not found")
    return ResearchCloseResponse(
        state_id=state_id, promoted=result["promoted"], closed=result["closed"]
    )


@router.post("/research/{state_id}/redirect", response_model=ResearchSessionOut)
async def redirect_session(
    state_id: int,
    body: ResearchRedirectRequest,
    session: AsyncSession = Depends(rw_session),
) -> ResearchSessionOut:
    """Steer an open session: update its topic and/or current task.

    The next resume reconstructs context from the state row, so the redirect takes effect at the
    next wakeup. Direct ORM update — the tools-only rule constrains the AI, not the API."""
    row = (
        await session.execute(select(ResearchState).where(ResearchState.id == state_id))
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="research session not found")
    if row.status is not StateStatus.open:
        raise HTTPException(status_code=409, detail="session is closed")
    if body.topic:
        row.topic = body.topic
    if body.current_task is not None:
        row.current_task = body.current_task
    await session.commit()
    return _session_out(row)


@router.post("/research/followup", response_model=FollowupResponse)
async def followup(body: FollowupRequest) -> FollowupResponse:
    """Transient scoped Q&A — the lightweight followup task; no session, nothing persisted."""
    out = await followup_wf.run(
        query=body.query, company_id=body.company_id, industry_id=body.industry_id
    )
    return FollowupResponse(answer=out.answer, sources=out.sources)
