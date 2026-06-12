"""Agent activity + budget — the "what is the agent doing, and what has it cost" surface.

Reads the ``tasks`` ledger (every workflow runs inside ``run_task``, so an in-flight run is
visible as a ``running`` row) and the weekly budget posture. This is the Home view's heartbeat.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.budget import spent_last_7_days
from app.api.deps import ro_session
from app.api.routes.research import _task_out
from app.api.schemas import ActivityOut, BudgetOut
from app.db.enums import TaskStatus
from app.db.models.tasks import Task
from app.db.models.user import UserPreferences

router = APIRouter(tags=["agent"])


@router.get("/agent/activity", response_model=ActivityOut)
async def activity(
    limit: int = 30, session: AsyncSession = Depends(ro_session)
) -> ActivityOut:
    """Running tasks (all of them) + the most recent terminal ones."""
    running = (
        await session.execute(
            select(Task).where(Task.status == TaskStatus.running).order_by(Task.id.desc())
        )
    ).scalars()
    recent = (
        await session.execute(
            select(Task)
            .where(Task.status != TaskStatus.running)
            .order_by(Task.id.desc())
            .limit(min(limit, 100))
        )
    ).scalars()
    return ActivityOut(
        running=[_task_out(t) for t in running],
        recent=[_task_out(t) for t in recent],
    )


@router.get("/budget", response_model=BudgetOut)
async def budget(session: AsyncSession = Depends(ro_session)) -> BudgetOut:
    """Weekly cap, spend over the trailing 7 days, and what remains (null = uncapped)."""
    prefs = (
        await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
    ).scalar_one_or_none()
    weekly = prefs.weekly_token_budget if prefs else None
    spent = await spent_last_7_days(session)
    return BudgetOut(
        weekly_token_budget=weekly,
        spent_7d=spent,
        remaining=(weekly - spent) if weekly is not None else None,
    )
