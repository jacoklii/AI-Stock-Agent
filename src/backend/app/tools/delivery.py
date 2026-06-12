"""Delivery tools + the shared send helper.

The notification ledger prevents the same finding going out twice — across channels, and across
multiple sources covering one event. This module holds:

- ``check_dedupe`` — the read-only "has this already been sent?" lookup (granted to no agent task;
  a deterministic workflow guard).
- ``deliver`` — the one place a send becomes a ledger row: dedupe on ``(channel, content_hash)`` →
  send via the notifier (in-app is ledger-only) → write the ``notifications`` row, all in the
  caller's session. Workflows (digest, brief) and the ``send_*`` tools both use it, so the
  send+hash+ledger logic lives once.
- ``send_email`` / ``send_imessage`` / ``send_whatsapp`` — thin tools over ``deliver``. Registered
  (MCP-visible) but granted to no agent task, like ``check_dedupe`` — the agent does not message
  autonomously; workflows do.
"""

from __future__ import annotations

import hashlib

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import Channel
from app.db.models.delivery import Notification
from app.providers.notifier import Notifier
from app.tools.registry import tool
from app.tools.tool_schema import DedupeResult, SendReceiptResult


@tool(
    name="check_dedupe",
    description="Whether a notification content_hash has already been sent (any channel).",
    tasks=set(),  # workflow-level guard, not an agent step
    output_model=DedupeResult,
)
async def check_dedupe(session: AsyncSession, *, content_hash: str) -> DedupeResult:
    stmt = select(Notification).where(Notification.content_hash == content_hash).limit(1)
    row = (await session.execute(stmt)).scalar_one_or_none()
    if row is None:
        return DedupeResult(content_hash=content_hash, already_sent=False)
    return DedupeResult(
        content_hash=content_hash,
        already_sent=True,
        channel=row.channel,
        sent_at=row.sent_at,
    )


def content_hash_for(*parts: str) -> str:
    """Deterministic dedup hash for a logical message on a channel."""
    return hashlib.sha256("\x00".join(parts).encode()).hexdigest()[:64]


async def deliver(
    session: AsyncSession,
    *,
    channel: Channel,
    content_hash: str,
    template: str | None = None,
    ref_type: str | None = None,
    ref_id: int | None = None,
    to_addr: str | None = None,
    subject: str | None = None,
    body: str | None = None,
    text: str | None = None,
    notifier: Notifier | None = None,
) -> SendReceiptResult:
    """Dedupe → send (external channels) → write the ledger row, in the caller's session.

    Skips and reports ``deduped`` if this ``(channel, content_hash)`` already went out. External
    channels with no address report ``sent=False`` and write no row; ``in_app`` is always recorded
    (the ledger row is the delivery)."""
    existing = (
        await session.execute(
            select(Notification.id)
            .where(Notification.channel == channel)
            .where(Notification.content_hash == content_hash)
            .limit(1)
        )
    ).scalar_one_or_none()
    if existing is not None:
        return SendReceiptResult(channel=channel, sent=False, deduped=True, detail="already sent")

    if notifier is None:
        from app.providers.notifier import get_notifier

        notifier = get_notifier()

    if channel is Channel.email:
        if not to_addr:
            return SendReceiptResult(channel=channel, sent=False, detail="no email address")
        await notifier.send_email(to_addr=to_addr, subject=subject or "", body=body or "")
    elif channel in (Channel.imessage, Channel.whatsapp):
        if not to_addr:
            return SendReceiptResult(channel=channel, sent=False, detail="no address")
        await notifier.send_message(to_addr=to_addr, text=text or "", channel=channel)

    # The ledger row carries a displayable snapshot (title/body) so the inbox and
    # /brief/latest can render what went out without re-generating it.
    session.add(
        Notification(
            channel=channel,
            template=template,
            content_hash=content_hash,
            ref_type=ref_type,
            ref_id=ref_id,
            title=subject,
            body=body or text,
        )
    )
    await session.commit()
    return SendReceiptResult(channel=channel, sent=True, detail=to_addr)


@tool(
    name="send_email",
    description="Send an email and record it in the notification ledger (deduped).",
    tasks=set(),  # workflow-level; the agent does not message autonomously
    output_model=SendReceiptResult,
    writes=True,
)
async def send_email(
    session: AsyncSession,
    notifier: Notifier,
    *,
    to_addr: str,
    subject: str,
    body: str,
    ref_type: str | None = None,
    ref_id: int | None = None,
) -> SendReceiptResult:
    return await deliver(
        session,
        channel=Channel.email,
        content_hash=content_hash_for("email", subject, body),
        template="email",
        ref_type=ref_type,
        ref_id=ref_id,
        to_addr=to_addr,
        subject=subject,
        body=body,
        notifier=notifier,
    )


@tool(
    name="send_imessage",
    description="Send an iMessage and record it in the notification ledger (deduped).",
    tasks=set(),
    output_model=SendReceiptResult,
    writes=True,
)
async def send_imessage(
    session: AsyncSession,
    notifier: Notifier,
    *,
    to_addr: str,
    text: str,
    ref_type: str | None = None,
    ref_id: int | None = None,
) -> SendReceiptResult:
    return await deliver(
        session,
        channel=Channel.imessage,
        content_hash=content_hash_for("imessage", text),
        template="message",
        ref_type=ref_type,
        ref_id=ref_id,
        to_addr=to_addr,
        text=text,
        notifier=notifier,
    )


@tool(
    name="send_whatsapp",
    description="Send a WhatsApp message and record it in the notification ledger (deduped).",
    tasks=set(),
    output_model=SendReceiptResult,
    writes=True,
)
async def send_whatsapp(
    session: AsyncSession,
    notifier: Notifier,
    *,
    to_addr: str,
    text: str,
    ref_type: str | None = None,
    ref_id: int | None = None,
) -> SendReceiptResult:
    return await deliver(
        session,
        channel=Channel.whatsapp,
        content_hash=content_hash_for("whatsapp", text),
        template="message",
        ref_type=ref_type,
        ref_id=ref_id,
        to_addr=to_addr,
        text=text,
        notifier=notifier,
    )
