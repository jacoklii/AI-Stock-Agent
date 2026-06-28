"""Per-section synthesis — the AI's only news writing.

For each surveillance domain (geopolitics / macro / industry / market) and each critical industry,
pull that section's recent events and have the researcher write one section snapshot (orientation
prose + 1–5 key tickers). Each is upserted into ``section_summary`` keyed by section: the four
domain keys for ``/world``, and ``"industry:<id>"`` for the daily digest's per-industry sections.

This generalizes the retired ``sector_research`` (per-critical-industry only) to every section, and
is the system's only per-news LLM spend — ingest just files Alpha Vantage's own summaries. Sections
with no events are skipped (no LLM call). Cost is Sonnet tokens, not Alpha Vantage calls, so it runs
a few times a day rather than on the ingest cadence.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select

from app.agents.researcher import TASKS, get_researcher
from app.config import SECTION_EVENT_LIMIT
from app.db.enums import NewsDomain
from app.db.models.companies import Industry
from app.db.models.section import SectionSummary
from app.db.models.user import UserPreferences
from app.db.payloads import SectionSummaryPayload
from app.db.session import SessionLocal, readonly_session
from app.tools.registry import TASK_SECTION_SNAPSHOT
from app.tools.research import get_news_events
from app.tools.tool_schema import NewsEventResult
from app.workflows.digest_types import DigestSection
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_SECTION_SYNTHESIS

# The four surveillance domains, in the fixed top-down order /world renders, with display titles.
_DOMAIN_TITLES: dict[str, str] = {
    "geopolitics": "Geopolitics & global events",
    "macro": "Macroeconomics",
    "industry": "Industry trends",
    "market": "General market",
}


async def _resolve_critical_industries(session) -> list[Industry]:
    prefs = (
        await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
    ).scalar_one_or_none()
    ids = list(prefs.critical_industries) if prefs and prefs.critical_industries else []
    if not ids:
        return []
    return list(
        (
            await session.execute(
                select(Industry).where(Industry.id.in_(ids)).where(Industry.is_active.is_(True))
            )
        ).scalars()
    )


async def _synthesize(title: str, events: list[NewsEventResult]):
    """Researcher writes the section snapshot (prose + key tickers) from the section's events."""
    return await get_researcher().run_task(
        TASK_SECTION_SNAPSHOT,
        inputs={"section": title, "events": [e.model_dump() for e in events]},
    )


async def _upsert(
    *, section_key: str, title: str, snapshot: str, key_tickers: list[str], event_ids: list[int], model_name: str
) -> None:
    """Write (or replace) the section's current row — one row per ``section_key``."""
    payload = SectionSummaryPayload(key_tickers=key_tickers, source_event_ids=event_ids)
    async with SessionLocal() as session:
        existing = (
            await session.execute(
                select(SectionSummary).where(SectionSummary.section_key == section_key)
            )
        ).scalar_one_or_none()
        if existing is not None:
            existing.title = title
            existing.snapshot = snapshot
            existing.payload = payload
            existing.model_name = model_name
            existing.generated_at = datetime.now(timezone.utc)
        else:
            session.add(
                SectionSummary(
                    section_key=section_key,
                    title=title,
                    snapshot=snapshot,
                    payload=payload,
                    model_name=model_name,
                )
            )
        await session.commit()


async def run() -> list[DigestSection]:
    """Synthesize every section; return the per-critical-industry sections for the daily digest."""
    model_name = TASKS[TASK_SECTION_SNAPSHOT].model
    digest_sections: list[DigestSection] = []
    async with run_task(WF_SECTION_SYNTHESIS) as task:
        # 1. The four surveillance domains — read by /world.
        for key, title in _DOMAIN_TITLES.items():
            async with readonly_session() as session:
                events = await get_news_events(
                    session, domain=NewsDomain(key), limit=SECTION_EVENT_LIMIT
                )
            if not events:
                continue
            out = await _synthesize(title, events)
            await _upsert(
                section_key=key,
                title=title,
                snapshot=out.snapshot,
                key_tickers=out.key_tickers,
                event_ids=[e.news_event_id for e in events],
                model_name=model_name,
            )
            task.count("domain_sections")

        # 2. Each critical industry — read by the daily digest (and surfaced as its own section).
        async with readonly_session() as session:
            industries = await _resolve_critical_industries(session)
        for ind in industries:
            async with readonly_session() as session:
                events = await get_news_events(
                    session, industry_id=ind.id, limit=SECTION_EVENT_LIMIT
                )
            if not events:
                continue
            out = await _synthesize(ind.name, events)
            event_ids = [e.news_event_id for e in events]
            await _upsert(
                section_key=f"industry:{ind.id}",
                title=ind.name,
                snapshot=out.snapshot,
                key_tickers=out.key_tickers,
                event_ids=event_ids,
                model_name=model_name,
            )
            digest_sections.append(
                DigestSection(
                    section_title=ind.name,
                    snapshot=out.snapshot,
                    article_refs=event_ids,
                    key_tickers=out.key_tickers,
                )
            )
            task.count("industry_sections")

        return digest_sections
