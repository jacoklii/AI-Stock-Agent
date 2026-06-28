"""Follow-up workflow — the chat's lightweight Q&A path.

A scoped question answered by the ``TASK_FOLLOWUP`` task (Sonnet, read tools + web search),
without opening a research session: no state row, nothing promoted, the answer goes back to the
caller. Budget-gated like deep research — an exhausted weekly budget returns a canned answer
instead of spending — and the spend is recorded on the ``tasks`` row.
"""

from __future__ import annotations

from app.agents.budget import Budget, remaining_weekly_budget
from app.agents.researcher import get_researcher
from app.agents.researcher.schemas import FollowupOut
from app.db.session import readonly_session
from app.tools.registry import TASK_FOLLOWUP
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_FOLLOWUP

_BUDGET_EXHAUSTED = (
    "The weekly token budget is exhausted, so I can't research this right now. "
    "Raise the budget in Settings or wait for the 7-day window to roll."
)


async def run(
    *, query: str, company_id: int | None = None, industry_id: int | None = None
) -> FollowupOut:
    async with readonly_session() as session:
        remaining = await remaining_weekly_budget(session)
    if remaining is not None and remaining <= 0:
        return FollowupOut(answer=_BUDGET_EXHAUSTED, sources=[])

    budget = Budget(ceiling=remaining)
    async with run_task(
        WF_FOLLOWUP, params={"query": query, "company_id": company_id, "industry_id": industry_id}
    ) as task:
        try:
            out = await get_researcher().run_task(
                TASK_FOLLOWUP,
                inputs={"query": query, "company_id": company_id, "industry_id": industry_id},
                budget=budget,
            )
        finally:
            task.tokens = budget.spent  # a failed run still spent tokens
        return out
