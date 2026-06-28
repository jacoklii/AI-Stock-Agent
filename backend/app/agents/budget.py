"""Token budget — the agent's cost spine and self-pacing limit.

``Budget`` is a plain per-session counter threaded through the researcher's tool-use loop: each
LLM call adds its token usage, and the loop stops (forces a structured submit) once ``ceiling``
is reached. ``remaining_weekly_budget`` reads the user's weekly cap minus what's already been
spent in the last 7 days, so a long-running session paces against real, recorded cost rather than
running unbounded.

``None`` ceiling means "no cap" — the budget still accumulates ``spent`` (so it's recorded on the
task), it just never forces a stop.

Units are *effective* (cost-weighted) tokens: ``input + output + 1.25*cache_write +
0.1*cache_read`` (see ``Budget.add_usage``) — proportional to dollars rather than raw counts.
An uncached call reduces to input+output, so rows recorded before prompt caching stay comparable.
Server-side web searches bill per-search on the Anthropic account, outside this budget.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.tasks import Task
from app.db.models.user import UserPreferences


@dataclass
class Budget:
    """A running token meter for one research session.

    ``spent`` is the blended, cost-weighted figure that paces the loop against the ceiling. The
    component fields (``input``/``output``/``cache_write``/``cache_read``) keep the raw breakdown so
    the session can report what actually went in vs out, and ``web_tool_uses`` counts the
    per-use-billed server web tools that fall outside the token figures entirely."""

    ceiling: int | None = None
    spent: int = 0
    input: int = 0
    output: int = 0
    cache_write: int = 0
    cache_read: int = 0
    web_tool_uses: dict[str, int] = field(default_factory=dict)

    def add(self, tokens: int) -> None:
        self.spent += tokens

    def add_usage(self, input: int, output: int, cache_write: int, cache_read: int) -> None:
        """Record one LLM call's usage (components in ``_usage_components`` order): accumulate each
        raw component and add its blended cost to ``spent``. Cost weighting — cache writes 1.25x an
        input token, cache reads 0.1x — is the single source of truth for what a token "costs"."""
        self.input += input
        self.output += output
        self.cache_write += cache_write
        self.cache_read += cache_read
        self.spent += round(input + output + 1.25 * cache_write + 0.1 * cache_read)

    def note_web(self, name: str) -> None:
        """Count one server-side web tool use (web_search / web_fetch) — billed per use, off-budget."""
        self.web_tool_uses[name] = self.web_tool_uses.get(name, 0) + 1

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
