"""Company detail view + watchlist promote/demote."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select

from app.api.deps import ro_session, rw_session
from app.api.schemas import ArticleOut, CompanyDetail, ProseOut, ScoreOut, WatchlistUpdate
from app.db.enums import CoverageTier, ProseKind
from app.db.models.companies import Company, WatchlistMetadata
from app.tools.analysis import get_latest_prose, get_latest_scores
from app.tools.research import get_company, get_news_events

router = APIRouter(tags=["companies"])


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
    for row in (latest.fundamental, latest.sentimental):
        if row is not None:
            scores.append(
                ScoreOut(
                    kind=row.kind,
                    score=row.score,
                    generated_at=row.generated_at,
                    data_through=row.data_through,
                )
            )

    prose: list[ProseOut] = []
    for kind in (ProseKind.fundamental, ProseKind.sentimental):
        row = await get_latest_prose(session, company_id=company_id, kind=kind)
        if row is not None:
            prose.append(
                ProseOut(
                    kind=row.kind,
                    body=row.body,
                    generated_at=row.generated_at,
                    citation_event_ids=[c.news_event_id for c in row.citations if c.news_event_id],
                )
            )

    return CompanyDetail(
        company_id=company.company_id,
        ticker=company.ticker,
        name=company.name,
        coverage_tier=company.coverage_tier,
        sector_id=company.sector_id,
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

    Promotion couples the tier change with the per-stock watchlist metadata — the same user
    action, one transaction. Demotion drops the tier; the metadata row is left for history.
    """
    company = (
        await session.execute(select(Company).where(Company.id == company_id))
    ).scalar_one_or_none()
    if company is None:
        raise HTTPException(status_code=404, detail="company not found")

    if body.action == "promote":
        company.coverage_tier = CoverageTier.watchlist
        meta = (
            await session.execute(
                select(WatchlistMetadata).where(WatchlistMetadata.company_id == company_id)
            )
        ).scalar_one_or_none()
        if meta is None:
            session.add(
                WatchlistMetadata(
                    company_id=company_id,
                    why_added=body.why_added,
                    why_relevant=body.why_relevant,
                )
            )
        else:
            if body.why_added is not None:
                meta.why_added = body.why_added
            if body.why_relevant is not None:
                meta.why_relevant = body.why_relevant
    else:  # demote
        company.coverage_tier = CoverageTier.discovered

    await session.commit()
    return {"company_id": company_id, "coverage_tier": company.coverage_tier.value}
