"""Alerts inbox — chronological notifications, each linking to its source."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session, rw_session
from app.api.schemas import InboxItem
from app.db.models.delivery import NotificationHistory

router = APIRouter(tags=["inbox"])


@router.get("/inbox", response_model=list[InboxItem])
async def inbox(limit: int = 100, session: AsyncSession = Depends(ro_session)) -> list[InboxItem]:
    rows = (
        await session.execute(
            select(NotificationHistory)
            .order_by(NotificationHistory.sent_at.desc())
            .limit(limit)
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
        )
        for r in rows
    ]


@router.post("/inbox/{notification_id}/read")
async def mark_read(notification_id: int, session: AsyncSession = Depends(rw_session)) -> None:
    raise HTTPException(status_code=501, detail="mark-read write path pending")


@router.post("/inbox/{notification_id}/dismiss")
async def dismiss(notification_id: int, session: AsyncSession = Depends(rw_session)) -> None:
    raise HTTPException(status_code=501, detail="dismiss write path pending")
