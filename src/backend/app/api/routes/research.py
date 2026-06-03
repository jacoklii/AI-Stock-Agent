"""On-demand research — scoped follow-up answered from stored research first."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.api.schemas import FollowupRequest, FollowupResponse

router = APIRouter(tags=["research"])


@router.post("/research/followup", response_model=FollowupResponse)
async def followup(body: FollowupRequest) -> FollowupResponse:
    # Wiring target: app.workflows.on_demand.run(query=..., company_id=..., sector_id=...).
    # Stubbed until the researcher agent (synthesis) lands.
    raise HTTPException(status_code=501, detail="pending on_demand_research workflow")
