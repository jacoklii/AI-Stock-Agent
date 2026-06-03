"""Home / detailed-digest mirror."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session
from app.api.schemas import DigestSectionOut, DigestView
from app.db.models.delivery import ReadingListRun

router = APIRouter(tags=["home"])


@router.get("/digest/latest", response_model=DigestView)
async def latest_digest(session: AsyncSession = Depends(ro_session)) -> DigestView:
    row = (
        await session.execute(
            select(ReadingListRun).order_by(ReadingListRun.generated_at.desc()).limit(1)
        )
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="no digest has been generated yet")
    return DigestView(
        id=row.id,
        generated_at=row.generated_at,
        top_snapshot=row.top_snapshot,
        sections=[
            DigestSectionOut(
                section_title=s.section_title,
                snapshot=s.snapshot,
                article_refs=[r.news_event_id for r in s.article_refs],
                key_tickers=list(s.key_tickers),
            )
            for s in row.sections
        ],
        source_event_ids=list(row.source_event_ids),
    )
