"""Market brief view + on-demand trigger.

The brief is transient (ARCHITECTURE.md): it is regenerated live from quotes and never persisted,
so there is no ``/brief/latest``. ``GET /brief/state`` returns live quotes for the brief set; the
on-demand ``POST /brief/run`` trigger is deferred until the brief workflow lands.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session
from app.api.schemas import BriefInstrumentOut, BriefStateOut
from app.providers.market import get_market_provider
from app.tools.research import get_brief_state
from app.workflows import market_pulse

router = APIRouter(tags=["brief"])


@router.get("/brief/state", response_model=BriefStateOut)
async def brief_state(session: AsyncSession = Depends(ro_session)) -> BriefStateOut:
    """Live quotes for the brief set (fixed core + user mega-caps)."""
    instruments = await get_brief_state(session, get_market_provider())
    return BriefStateOut(
        instruments=[BriefInstrumentOut.model_validate(i.model_dump()) for i in instruments]
    )


@router.post("/brief/run")
async def run_brief() -> dict:
    """On-demand market brief: generate the snapshot and deliver it now (iMessage + inbox)."""
    await market_pulse.run(slot="on_demand")
    return {"status": "ok"}
