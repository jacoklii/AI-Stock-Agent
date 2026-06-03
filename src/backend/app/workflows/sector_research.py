"""Sector research pipeline — roll up sector state, surface movers, feed the digest.

Runs for flagged sectors (``user_preferences.interested_sectors``). Aggregates score/breadth/
sentiment, identifies movers, and surfaces notable activity; the rolled-up state is written to
``sector_aggregate`` and the section snapshot feeds the daily digest.

Skeleton status: sector resolution, the sentiment roll-up, and the ``sector_aggregate`` write
are real; the section snapshot prose (agent) is deferred. Breadth/ETF price are left for the
scoring pass to populate.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select

from app.db.models.companies import Industry, Sector
from app.db.models.news import NewsEvent, SectorAggregate
from app.db.models.user import UserPreferences
from app.db.session import SessionLocal, readonly_session
from app.workflows.runtime import run_job
from app.workflows.triggers import WF_SECTOR_RESEARCH


async def _resolve_flagged_sectors(session) -> list[Sector]:
    prefs = (
        await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
    ).scalar_one_or_none()
    keys = list(prefs.interested_sectors) if prefs and prefs.interested_sectors else []
    if not keys:
        return []
    return list((await session.execute(select(Sector).where(Sector.key.in_(keys)))).scalars())


async def _rolled_sentiment(session, sector_id: int) -> float | None:
    """Mean news sentiment across the sector's industries (deterministic roll-up). — real"""
    stmt = (
        select(func.avg(NewsEvent.sentiment_score))
        .join(Industry, Industry.id == NewsEvent.industry_id)
        .where(Industry.sector_id == sector_id)
        .where(NewsEvent.sentiment_score.is_not(None))
    )
    value = (await session.execute(stmt)).scalar_one_or_none()
    return float(value) if value is not None else None


async def _generate_section_snapshot(sector: Sector, rolled_sentiment: float | None) -> str:
    """Researcher writes the sector section snapshot for the digest."""
    raise NotImplementedError("TODO(agent): section_snapshot")


async def run() -> None:
    today = datetime.now(timezone.utc).date()
    async with run_job(WF_SECTOR_RESEARCH) as job:
        async with readonly_session() as session:
            sectors = await _resolve_flagged_sectors(session)
            rollups = {s.id: await _rolled_sentiment(session, s.id) for s in sectors}
        job.count("sectors", len(sectors))

        # 1. Persist the rolled-up sector state. — real write
        async with SessionLocal() as session:
            for sector in sectors:
                session.add(
                    SectorAggregate(
                        sector_id=sector.id,
                        date=today,
                        rolled_sentiment=rollups[sector.id],
                    )
                )
            await session.commit()

        # 2. Section snapshots for the digest. — TODO(agent)
        for sector in sectors:
            await _generate_section_snapshot(sector, rollups[sector.id])
