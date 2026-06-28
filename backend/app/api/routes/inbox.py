"""Alerts inbox — chronological notifications, each linking to its source."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session, rw_session
from app.api.schemas import InboxItem
from app.db.models.delivery import Notification

router = APIRouter(tags=["inbox"])


@router.get("/inbox", response_model=list[InboxItem])
async def inbox(limit: int = 100, session: AsyncSession = Depends(ro_session)) -> list[InboxItem]:
    rows = (
        await session.execute(
            select(Notification).order_by(Notification.sent_at.desc()).limit(limit)
        )
    ).scalars()
    return [
        InboxItem(
            id=r.id,
            sent_at=r.sent_at,
            channel=r.channel,
            template=r.template,
            ref_type=r.ref_type,
            ref_id=r.ref_id,
            title=r.title,
            body=r.body,
            read_at=r.read_at,
            dismissed_at=r.dismissed_at,
        )
        for r in rows
    ]


async def _get_notification(notification_id: int, session: AsyncSession) -> Notification:
    row = (
        await session.execute(
            select(Notification).where(Notification.id == notification_id)
        )
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="notification not found")
    return row


@router.post("/inbox/{notification_id}/read")
async def mark_read(notification_id: int, session: AsyncSession = Depends(rw_session)) -> dict:
    row = await _get_notification(notification_id, session)
    row.read_at = datetime.now(timezone.utc)
    await session.commit()
    return {"id": notification_id, "read_at": row.read_at.isoformat()}


@router.post("/inbox/{notification_id}/dismiss")
async def dismiss(notification_id: int, session: AsyncSession = Depends(rw_session)) -> dict:
    row = await _get_notification(notification_id, session)
    now = datetime.now(timezone.utc)
    row.dismissed_at = now
    if row.read_at is None:  # dismissing also marks read
        row.read_at = now
    await session.commit()
    return {"id": notification_id, "dismissed_at": now.isoformat()}
