"""On-demand research — scoped follow-up answered from stored research first."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.schemas import FollowupRequest, FollowupResponse
from app.workflows import on_demand

router = APIRouter(tags=["research"])


@router.post("/research/followup", response_model=FollowupResponse)
async def followup(body: FollowupRequest) -> FollowupResponse:
    """Answer a scoped follow-up. Runs the on-demand pipeline (stored research first, fresh fetch
    only if needed) and returns the researcher's synthesized answer with its source event IDs."""
    result = await on_demand.run(
        query=body.query, company_id=body.company_id, sector_id=body.sector_id
    )
    return FollowupResponse(answer=result["answer"], sources=result["sources"])
