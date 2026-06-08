"""Industry research pipeline — surface movers for the user's critical industries.

Runs for the user's critical industries (``user_preferences.critical_industries``). For each
tracked industry, aggregates recent news and the researcher writes the section snapshot. Section
snapshots are **returned** so the daily digest reuses them directly.

Industry state is derived at query time from ``news_events`` significance scores.
"""

from __future__ import annotations

from sqlalchemy import select

from app.agents.researcher import get_researcher
from app.db.models.companies import Industry
from app.db.models.user import UserPreferences
from app.db.payloads import DigestSection
from app.db.session import readonly_session
from app.tools.registry import TASK_SECTION_SNAPSHOT
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_SECTOR_RESEARCH


async def _resolve_critical_industries(session) -> list[Industry]:
    prefs = (
        await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
    ).scalar_one_or_none()
    ids = list(prefs.critical_industries) if prefs and prefs.critical_industries else []
    if not ids:
        return []
    return list(
        (await session.execute(select(Industry).where(Industry.id.in_(ids)).where(Industry.is_active.is_(True)))).scalars()
    )


async def _generate_section(industry: Industry) -> DigestSection:
    """Researcher writes the industry's digest section (snapshot + key tickers)."""
    out = await get_researcher().run_task(
        TASK_SECTION_SNAPSHOT,
        inputs={"industry": {"id": industry.id, "key": industry.key, "name": industry.name}},
    )
    return DigestSection(
        section_title=industry.name,
        snapshot=out.snapshot,
        key_tickers=out.key_tickers,
    )


async def run() -> list[DigestSection]:
    async with run_task(WF_SECTOR_RESEARCH) as task:
        async with readonly_session() as session:
            industries = await _resolve_critical_industries(session)
        task.count("industries", len(industries))

        sections = [await _generate_section(ind) for ind in industries]
        task.count("sections", len(sections))
        return sections
