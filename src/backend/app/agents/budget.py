"""Token budget — the agent's cost spine and self-pacing limit.

``Budget`` is a plain per-session counter threaded through the researcher's tool-use loop: each
LLM call adds its token usage, and the loop stops (forces a structured submit) once ``ceiling``
is reached. ``remaining_weekly_budget`` reads the user's weekly cap minus what's already been
spent in the last 7 days, so a long-running session paces against real, recorded cost rather than
running unbounded.

``None`` ceiling means "no cap" — the budget still accumulates ``spent`` (so it's recorded on the
task), it just never forces a stop.

Units are *effective* (cost-weighted) tokens: ``input + output + 1.25*cache_write +
0.1*cache_read`` (see ``agent._usage_tokens``) — proportional to dollars rather than raw counts.
An uncached call reduces to input+output, so rows recorded before prompt caching stay comparable.
Server-side web searches bill per-search on the Anthropic account, outside this budget.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.tasks import Task
from app.db.models.user import UserPreferences


@dataclass
class Budget:
    """A running token meter for one research session."""

    ceiling: int | None = None
    spent: int = 0

    def add(self, tokens: int) -> None:
        self.spent += tokens

    def over(self) -> bool:
        return self.ceiling is not None and self.spent >= self.ceiling


async def spent_last_7_days(session: AsyncSession) -> int:
    """Tokens recorded on ``tasks`` rows started in the last 7 days — the real spend."""
    since = datetime.now(timezone.utc) - timedelta(days=7)
    spent = (
        await session.execute(
            select(func.coalesce(func.sum(Task.tokens_used), 0)).where(Task.started_at >= since)
        )
    ).scalar_one()
    return int(spent)


async def remaining_weekly_budget(session: AsyncSession) -> int | None:
    """The user's weekly token budget minus tokens spent in the last 7 days.

    ``None`` (no configured budget) means uncapped. A non-positive result means the budget is
    already exhausted — callers should decline to start a new session."""
    prefs = (
        await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
    ).scalar_one_or_none()
    if prefs is None or prefs.weekly_token_budget is None:
        return None
    return prefs.weekly_token_budget - await spent_last_7_days(session)
