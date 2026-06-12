"""Market brief view + on-demand trigger.

The brief itself is transient (ARCHITECTURE.md): regenerated live from quotes, never persisted
as its own table. ``GET /brief/state`` returns live quotes; ``GET /brief/latest`` reads back the
last delivered snapshot from the notification ledger (the in-app mirror row carries the body).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session
from app.api.schemas import BriefInstrumentOut, BriefLatestOut, BriefStateOut
from app.db.enums import Channel
from app.db.models.delivery import Notification
from app.providers.market import get_market_provider
from app.tools.research import get_brief_state
from app.workflows.message import market_pulse

router = APIRouter(tags=["brief"])


@router.get("/brief/state", response_model=BriefStateOut)
async def brief_state(session: AsyncSession = Depends(ro_session)) -> BriefStateOut:
    """Live quotes for the brief set (fixed core + user mega-caps)."""
    instruments = await get_brief_state(session, get_market_provider())
    return BriefStateOut(
        instruments=[BriefInstrumentOut.model_validate(i.model_dump()) for i in instruments]
    )


@router.get("/brief/latest", response_model=BriefLatestOut | None)
async def brief_latest(session: AsyncSession = Depends(ro_session)) -> BriefLatestOut | None:
    """The most recently delivered brief snapshot (from the in-app ledger mirror).

    "Nothing delivered yet" is an expected state, not an error — 200/null, like the digest."""
    row = (
        await session.execute(
            select(Notification)
            .where(Notification.channel == Channel.in_app)
            .where(Notification.ref_type == "brief")
            .order_by(Notification.sent_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if row is None:
        return None
    return BriefLatestOut(title=row.title, body=row.body, sent_at=row.sent_at)


@router.post("/brief/run")
async def run_brief() -> dict:
    """On-demand market brief: generate the snapshot and deliver it now (per brief channels)."""
    await market_pulse.run(slot="on_demand")
    return {"status": "ok"}
