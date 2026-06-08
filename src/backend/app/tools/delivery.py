"""Delivery read tool: cross-channel dedupe lookup.

The notification ledger prevents the same finding going out twice — across channels, and across
multiple sources covering one event. The *send* side (writing the ledger row, hitting SMTP /
iMessage) ships with the delivery workflow and the notifier provider; this pass exposes only
the read half: "has this already been sent?". It's a deterministic, workflow-level guard, so
it's registered (a predefined tool) but granted to no agent task.

Dedup is keyed on ``(channel, content_hash)`` — a deterministic hash of the notification
content. The ``check_dedupe`` tool accepts a pre-computed hash and returns whether it's been
sent on any channel (or a specific channel).
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.delivery import Notification
from app.tools.registry import tool
from app.tools.tool_schema import DedupeResult


@tool(
    name="check_dedupe",
    description="Whether a notification content_hash has already been sent (any channel).",
    tasks=set(),  # workflow-level guard, not an agent step
    output_model=DedupeResult,
)
async def check_dedupe(session: AsyncSession, *, content_hash: str) -> DedupeResult:
    stmt = (
        select(Notification)
        .where(Notification.content_hash == content_hash)
        .limit(1)
    )
    row = (await session.execute(stmt)).scalar_one_or_none()
    if row is None:
        return DedupeResult(content_hash=content_hash, already_sent=False)
    return DedupeResult(
        content_hash=content_hash,
        already_sent=True,
        channel=row.channel,
        sent_at=row.sent_at,
    )
