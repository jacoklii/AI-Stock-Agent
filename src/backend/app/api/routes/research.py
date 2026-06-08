"""On-demand research — scoped follow-up answered from stored research first.

The on-demand research pipeline is deferred (lives in ``app/workflows``), so this endpoint
returns 501 until that workflow lands. The request contract is kept so the UI can integrate now.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.api.schemas import FollowupRequest, FollowupResponse

router = APIRouter(tags=["research"])


@router.post("/research/followup", response_model=FollowupResponse)
async def followup(body: FollowupRequest) -> FollowupResponse:
    """Answer a scoped follow-up via the on-demand research pipeline. Deferred — not implemented yet."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="on-demand research workflow not implemented yet",
    )
