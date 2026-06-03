"""Delivery read tool: cross-channel dedupe lookup.

The notification ledger prevents the same finding going out twice — across channels, and across
multiple sources covering one event. The *send* side (writing the ledger row, hitting SMTP /
iMessage) ships with the delivery workflow and the notifier provider; this pass exposes only
the read half: "has this already been sent?". It's a deterministic, workflow-level guard, so
it's registered (a predefined tool) but granted to no agent task.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.delivery import NotificationHistory
from app.tools.registry import tool
from app.tools.tool_schema import DedupeResult


@tool(
    name="check_dedupe",
    description="Whether a notification dedupe_key has already been sent (any channel).",
    tasks=set(),  # workflow-level guard, not an agent step
    output_model=DedupeResult,
)
async def check_dedupe(session: AsyncSession, *, dedupe_key: str) -> DedupeResult:
    stmt = select(NotificationHistory).where(NotificationHistory.dedupe_key == dedupe_key)
    row = (await session.execute(stmt)).scalar_one_or_none()
    if row is None:
        return DedupeResult(dedupe_key=dedupe_key, already_sent=False)
    return DedupeResult(
        dedupe_key=dedupe_key,
        already_sent=True,
        channel=row.channel,
        sent_at=row.sent_at,
    )
