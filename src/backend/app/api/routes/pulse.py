"""Market pulse view + on-demand trigger."""

from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session
from app.api.schemas import PulseInstrumentOut, PulseRunOut, PulseStateOut
from app.db.models.delivery import PulseRun
from app.providers.market import get_market_provider
from app.tools.research import get_pulse_state
from app.workflows import market_pulse

router = APIRouter(tags=["pulse"])


@router.get("/pulse/state", response_model=PulseStateOut)
async def pulse_state(session: AsyncSession = Depends(ro_session)) -> PulseStateOut:
    """Live quotes for the pulse set (fixed core + user mega-caps)."""
    instruments = await get_pulse_state(session, get_market_provider())
    return PulseStateOut(
        instruments=[PulseInstrumentOut.model_validate(i.model_dump()) for i in instruments]
    )


@router.get("/pulse/latest", response_model=PulseRunOut)
async def pulse_latest(session: AsyncSession = Depends(ro_session)) -> PulseRunOut:
    row = (
        await session.execute(select(PulseRun).order_by(PulseRun.generated_at.desc()).limit(1))
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="no pulse has been generated yet")
    return PulseRunOut(
        id=row.id,
        slot=row.slot.value,
        generated_at=row.generated_at,
        pulse_snapshot=row.pulse_snapshot,
        instruments=[PulseInstrumentOut.model_validate(i.model_dump()) for i in row.instruments],
    )


@router.post("/pulse/run", status_code=status.HTTP_202_ACCEPTED)
async def run_pulse(background: BackgroundTasks) -> dict:
    """Trigger an on-demand market pulse. The workflow runs in the background (fetch + snapshot +
    deliver); poll ``GET /pulse/latest`` for the result."""
    background.add_task(market_pulse.run, slot="on_demand")
    return {"status": "accepted", "workflow": "market_pulse", "slot": "on_demand"}
