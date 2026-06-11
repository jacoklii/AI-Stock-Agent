"""On-demand research — a scoped follow-up answered by a bounded deep-research session.

The request opens a user-initiated ``deep_research`` session (state-first, then external, capped
at ``deep_research_max_active`` concurrent sessions). The synthesized answer is returned; findings
are not auto-promoted on a user request.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.schemas import FollowupRequest, FollowupResponse
from app.workflows.research import deep_research

router = APIRouter(tags=["research"])


@router.post("/research/followup", response_model=FollowupResponse)
async def followup(body: FollowupRequest) -> FollowupResponse:
    """Answer a scoped follow-up via a bounded deep-research session."""
    result = await deep_research.run(
        query=body.query,
        company_id=body.company_id,
        industry_id=body.industry_id,
        initiated_by="user",
        resume_state_id=body.resume_state_id,
    )
    if result.get("blocked"):
        return FollowupResponse(
            answer="Research is at capacity (max active sessions reached). Try again shortly.",
            sources=[],
        )
    return FollowupResponse(answer=result["answer"], sources=result["sources"])
