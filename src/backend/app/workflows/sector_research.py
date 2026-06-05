"""Sector research pipeline — roll up sector state, surface movers, feed the digest.

Runs for flagged sectors (``user_preferences.interested_sectors``). Aggregates score/breadth/
sentiment (deterministic), and the researcher writes each sector's section snapshot. The rolled-up
state is written to ``sector_aggregate``; the section snapshots are **returned** so the daily
digest reuses them directly (no orphan LLM calls, no cross-run storage needed).
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select

from app.agents.researcher import get_researcher
from app.db.models.companies import Industry, Sector
from app.db.models.news import NewsEvent, SectorAggregate
from app.db.models.user import UserPreferences
from app.db.payloads import DigestSection
from app.db.session import SessionLocal, readonly_session
from app.tools.registry import TASK_SECTION_SNAPSHOT
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
    """Mean news sentiment across the sector's industries (deterministic roll-up)."""
    stmt = (
        select(func.avg(NewsEvent.sentiment_score))
        .join(Industry, Industry.id == NewsEvent.industry_id)
        .where(Industry.sector_id == sector_id)
        .where(NewsEvent.sentiment_score.is_not(None))
    )
    value = (await session.execute(stmt)).scalar_one_or_none()
    return float(value) if value is not None else None


async def _generate_section(sector: Sector, rolled_sentiment: float | None) -> DigestSection:
    """Researcher writes the sector's digest section (snapshot + key tickers)."""
    out = await get_researcher().run_task(
        TASK_SECTION_SNAPSHOT,
        inputs={
            "sector": {"id": sector.id, "key": sector.key, "name": sector.name},
            "rolled_sentiment": rolled_sentiment,
        },
    )
    return DigestSection(
        section_title=sector.name,
        snapshot=out.snapshot,
        key_tickers=out.key_tickers,
    )


async def run() -> list[DigestSection]:
    today = datetime.now(timezone.utc).date()
    async with run_job(WF_SECTOR_RESEARCH) as job:
        async with readonly_session() as session:
            sectors = await _resolve_flagged_sectors(session)
            rollups = {s.id: await _rolled_sentiment(session, s.id) for s in sectors}
        job.count("sectors", len(sectors))

        # 1. Persist the rolled-up sector state. — write
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

        # 2. Section snapshots for the digest. — researcher (returned, not stored)
        sections = [await _generate_section(s, rollups[s.id]) for s in sectors]
        job.count("sections", len(sections))
        return sections
