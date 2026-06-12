"""Company detail view + watchlist promote/demote."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session, rw_session
from app.api.schemas import (
    ArticleOut,
    CompanyDetail,
    CompanyListItem,
    ProseOut,
    ScoreOut,
    WatchlistUpdate,
)
from app.db.enums import CoverageTier
from app.db.models.companies import Company
from app.tools.analysis import get_latest_prose, get_latest_scores
from app.tools.research import get_company, get_news_events, screen_stocks
from app.tools.tool_schema import ScreenFilters

router = APIRouter(tags=["companies"])


@router.get("/companies", response_model=list[CompanyListItem])
async def list_companies(
    tier: CoverageTier | None = None,
    limit: int = 100,
    session: AsyncSession = Depends(ro_session),
) -> list[CompanyListItem]:
    """Companies, optionally filtered by coverage tier (e.g. the watchlist)."""
    candidates = await screen_stocks(
        session, filters=ScreenFilters(coverage_tier=tier, limit=min(limit, 500))
    )
    return [
        CompanyListItem(
            company_id=c.company_id,
            ticker=c.ticker,
            name=c.name,
            sector=c.sector,
            industry_id=c.industry_id,
            coverage_tier=c.coverage_tier,
        )
        for c in candidates
    ]


@router.get("/companies/{company_id}", response_model=CompanyDetail)
async def company_detail(
    company_id: int, session: AsyncSession = Depends(ro_session)
) -> CompanyDetail:
    company = await get_company(session, company_id=company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="company not found")

    news = await get_news_events(session, company_id=company_id, limit=50)
    latest = await get_latest_scores(session, company_id=company_id)

    scores: list[ScoreOut] = []
    for kind, row in (("fundamental", latest.fundamental), ("sentimental", latest.sentimental)):
        if row is not None:
            scores.append(
                ScoreOut(
                    kind=kind,
                    score=row.score,
                    generated_at=row.generated_at,
                    data_through=row.data_through,
                )
            )

    prose: list[ProseOut] = []
    for kind in ("fundamental", "sentimental"):
        row = await get_latest_prose(session, company_id=company_id, kind=kind)
        if row is not None:
            prose.append(
                ProseOut(
                    kind=kind,
                    body=row.body,
                    generated_at=row.generated_at,
                    source_event_ids=[s.news_event_id for s in row.sources if s.news_event_id],
                )
            )

    return CompanyDetail(
        company_id=company.company_id,
        ticker=company.ticker,
        name=company.name,
        coverage_tier=company.coverage_tier,
        sector=company.sector,
        industry_id=company.industry_id,
        exchange=company.exchange,
        articles=[ArticleOut.model_validate(e.model_dump()) for e in news],
        scores=scores,
        prose=prose,
    )


@router.post("/companies/{company_id}/watchlist")
async def update_watchlist(
    company_id: int, body: WatchlistUpdate, session: AsyncSession = Depends(rw_session)
) -> dict:
    """Promote a company to the watchlist (deep coverage) or demote it back to discovered.

    Watchlist membership is the ``coverage_tier`` column on ``companies`` — promotion/demotion is
    a single tier flip. Per-company alert thresholds live on ``user_preferences``.
    """
    company = (
        await session.execute(select(Company).where(Company.id == company_id))
    ).scalar_one_or_none()
    if company is None:
        raise HTTPException(status_code=404, detail="company not found")

    company.coverage_tier = (
        CoverageTier.watchlist if body.action == "promote" else CoverageTier.discovered
    )
    await session.commit()
    return {"company_id": company_id, "coverage_tier": company.coverage_tier.value}
