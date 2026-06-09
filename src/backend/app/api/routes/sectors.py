"""Industry view + flag/unflag for critical-industries tracking."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session, rw_session
from app.api.schemas import ArticleOut, IndustryFlagUpdate, IndustryView
from app.db.models.companies import Company, Industry
from app.db.models.news import NewsEvent
from app.db.models.user import UserPreferences

router = APIRouter(tags=["industries"])


@router.get("/industries/{industry_id}", response_model=IndustryView)
async def industry_view(
    industry_id: int, session: AsyncSession = Depends(ro_session)
) -> IndustryView:
    industry = (
        await session.execute(select(Industry).where(Industry.id == industry_id))
    ).scalar_one_or_none()
    if industry is None:
        raise HTTPException(status_code=404, detail="industry not found")

    events = (
        await session.execute(
            select(NewsEvent)
            .join(Company, Company.id == NewsEvent.company_id)
            .where(Company.industry_id == industry_id)
            .order_by(NewsEvent.published_at.desc())
            .limit(50)
        )
    ).scalars()

    return IndustryView(
        industry_id=industry.id,
        key=industry.key,
        name=industry.name,
        description=industry.description,
        articles=[
            ArticleOut(
                news_event_id=e.id,
                url=e.url,
                source=e.source,
                published_at=e.published_at,
                headline=e.headline,
                summary=e.summary,
                significance=e.significance,
                tickers=list(e.tickers),
            )
            for e in events
        ],
    )


@router.post("/industries/{industry_id}/flag")
async def flag_industry(
    industry_id: int, body: IndustryFlagUpdate, session: AsyncSession = Depends(rw_session)
) -> dict:
    """Add/remove an industry from the user's critical-industries list."""
    industry = (
        await session.execute(select(Industry).where(Industry.id == industry_id))
    ).scalar_one_or_none()
    if industry is None:
        raise HTTPException(status_code=404, detail="industry not found")

    prefs = (
        await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
    ).scalar_one_or_none()
    if prefs is None:
        raise HTTPException(status_code=404, detail="preferences not initialized")

    flagged = set(prefs.critical_industries or [])
    if body.flagged:
        flagged.add(industry_id)
    else:
        flagged.discard(industry_id)
    prefs.critical_industries = sorted(flagged)
    await session.commit()
    return {
        "industry_id": industry_id,
        "flagged": body.flagged,
        "critical_industries": list(prefs.critical_industries),
    }
