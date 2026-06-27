"""Flat news-events feed — the cross-domain article stream behind the UI's "News & events".

A thin read over the same data the surveillance feed groups: it reuses the ``get_news_events`` read
tool (the AI's own DB access) rather than re-querying, so the UI and the agent see identical rows.
Filterable by surveillance ``domain`` and ``source_country`` (the GDELT geographic dimension); the
client groups the flat result into per-domain sections. Read-only, no LLM in the request.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session
from app.api.schemas import ArticleOut
from app.db.enums import NewsDomain
from app.tools.research import get_news_events

router = APIRouter(tags=["events"])


@router.get("/events", response_model=list[ArticleOut])
async def list_events(
    domain: NewsDomain | None = None,
    source_country: str | None = None,
    limit: int = 80,
    session: AsyncSession = Depends(ro_session),
) -> list[ArticleOut]:
    """Recent news events (newest first), optionally filtered by ``domain`` / ``source_country``.

    Reuses ``get_news_events`` so the wire rows match the agent's view exactly; each
    ``NewsEventResult`` (which already carries ``domain`` + ``source_country``) maps straight onto
    ``ArticleOut``."""
    events = await get_news_events(
        session, domain=domain, source_country=source_country, limit=limit
    )
    return [ArticleOut.model_validate(e.model_dump()) for e in events]
