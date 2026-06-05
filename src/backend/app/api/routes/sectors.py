"""Sector view + flag/unflag for deep research."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session, rw_session
from app.api.schemas import ArticleOut, SectorAggregateOut, SectorFlagUpdate, SectorView
from app.db.models.companies import Industry, Sector
from app.db.models.news import NewsEvent, SectorAggregate
from app.db.models.user import UserPreferences

router = APIRouter(tags=["sectors"])


@router.get("/sectors/{sector_id}", response_model=SectorView)
async def sector_view(
    sector_id: int, session: AsyncSession = Depends(ro_session)
) -> SectorView:
    sector = (
        await session.execute(select(Sector).where(Sector.id == sector_id))
    ).scalar_one_or_none()
    if sector is None:
        raise HTTPException(status_code=404, detail="sector not found")

    agg = (
        await session.execute(
            select(SectorAggregate)
            .where(SectorAggregate.sector_id == sector_id)
            .order_by(SectorAggregate.date.desc())
            .limit(1)
        )
    ).scalar_one_or_none()

    events = (
        await session.execute(
            select(NewsEvent)
            .join(Industry, Industry.id == NewsEvent.industry_id)
            .where(Industry.sector_id == sector_id)
            .order_by(NewsEvent.published_at.desc())
            .limit(50)
        )
    ).scalars()

    return SectorView(
        sector_id=sector.id,
        key=sector.key,
        name=sector.name,
        aggregate=(
            SectorAggregateOut(
                date=agg.date,
                etf_price=float(agg.etf_price) if agg.etf_price is not None else None,
                breadth=agg.breadth,
                rolled_sentiment=agg.rolled_sentiment,
            )
            if agg is not None
            else None
        ),
        articles=[
            ArticleOut(
                news_event_id=e.id,
                url=e.url,
                source=e.source,
                published_at=e.published_at,
                headline=e.headline,
                summary=e.summary,
                significance_tier=e.significance_tier,
                sentiment_score=e.sentiment_score,
                tickers=list(e.tickers),
            )
            for e in events
        ],
    )


@router.post("/sectors/{sector_id}/flag")
async def flag_sector(
    sector_id: int, body: SectorFlagUpdate, session: AsyncSession = Depends(rw_session)
) -> dict:
    """Flag/unflag a sector for deep research by editing ``interested_sectors`` (taxonomy keys)."""
    sector = (
        await session.execute(select(Sector).where(Sector.id == sector_id))
    ).scalar_one_or_none()
    if sector is None:
        raise HTTPException(status_code=404, detail="sector not found")

    prefs = (
        await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
    ).scalar_one_or_none()
    if prefs is None:
        raise HTTPException(status_code=404, detail="preferences not initialized")

    flagged = set(prefs.interested_sectors)
    if body.flagged:
        flagged.add(sector.key)
    else:
        flagged.discard(sector.key)
    prefs.interested_sectors = sorted(flagged)  # reassign so the ARRAY change is tracked
    await session.commit()
    return {"sector_id": sector_id, "flagged": body.flagged, "interested_sectors": list(prefs.interested_sectors)}
