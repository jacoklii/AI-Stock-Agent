"""Seed the curated universe: taxonomy, a starter watchlist, and user preferences.

This is an ops script (top-level ``scripts/``, not inside ``app/``), per the repo
structure note about seeding a curated sector universe. The fixed ``pulse_core`` set and
default thresholds are NOT seeded — they live in ``app/config.py`` and are read at runtime.

Every upsert is keyed on a natural key via ``ON CONFLICT ... DO UPDATE``, so re-running is
safe and converges to the constants below.

Run: ``python -m scripts.seed`` (with the venv active, from ``src/backend``).
"""

from __future__ import annotations

import asyncio
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import DEFAULT_THRESHOLDS
from app.db.enums import CoverageTier
from app.db.models import Company, Industry, Sector, UserPreferences, WatchlistMetadata
from app.db.session import SessionLocal

# --- Curated constants --------------------------------------------------------

SECTORS: list[dict[str, str]] = [
    {"key": "technology", "name": "Technology"},
    {"key": "industrials", "name": "Industrials"},
    {"key": "energy", "name": "Energy"},
    {"key": "health-care", "name": "Health Care"},
    {"key": "financials", "name": "Financials"},
    {"key": "consumer-discretionary", "name": "Consumer Discretionary"},
    {"key": "consumer-staples", "name": "Consumer Staples"},
    {"key": "utilities", "name": "Utilities"},
    {"key": "materials", "name": "Materials"},
    {"key": "real-estate", "name": "Real Estate"},
    {"key": "communication-services", "name": "Communication Services"},
]

# Granular where critical, coarse where not (Utilities, Real Estate stay single buckets).
INDUSTRIES: list[dict[str, str]] = [
    {"key": "semiconductors", "name": "Semiconductors", "sector": "technology"},
    {"key": "ai-ml-infrastructure", "name": "AI & ML Infrastructure", "sector": "technology"},
    {"key": "software", "name": "Software", "sector": "technology"},
    {"key": "hardware-devices", "name": "Hardware & Devices", "sector": "technology"},
    {"key": "cybersecurity", "name": "Cybersecurity", "sector": "technology"},
    {"key": "cloud-data-centers", "name": "Cloud & Data Centers", "sector": "technology"},
    {"key": "aerospace", "name": "Aerospace", "sector": "industrials"},
    {"key": "defense", "name": "Defense", "sector": "industrials"},
    {"key": "industrials-other", "name": "Industrials (Other)", "sector": "industrials"},
    {"key": "oil-gas", "name": "Oil & Gas", "sector": "energy"},
    {"key": "renewables-clean-energy", "name": "Renewables & Clean Energy", "sector": "energy"},
    {"key": "biotech-pharma", "name": "Biotech & Pharma", "sector": "health-care"},
    {"key": "medical-devices", "name": "Medical Devices", "sector": "health-care"},
    {"key": "health-services", "name": "Health Services", "sector": "health-care"},
    {"key": "banks", "name": "Banks", "sector": "financials"},
    {"key": "fintech-payments", "name": "Fintech & Payments", "sector": "financials"},
    {"key": "insurance", "name": "Insurance", "sector": "financials"},
    {"key": "capital-markets", "name": "Capital Markets", "sector": "financials"},
    {"key": "ev-autos", "name": "EV & Autos", "sector": "consumer-discretionary"},
    {"key": "retail-ecommerce", "name": "Retail & E-Commerce", "sector": "consumer-discretionary"},
    {"key": "travel-leisure", "name": "Travel & Leisure", "sector": "consumer-discretionary"},
    {"key": "consumer-discretionary-other", "name": "Consumer Discretionary (Other)", "sector": "consumer-discretionary"},
    {"key": "consumer-staples", "name": "Consumer Staples", "sector": "consumer-staples"},
    {"key": "utilities", "name": "Utilities", "sector": "utilities"},
    {"key": "battery-critical-materials", "name": "Battery & Critical Materials", "sector": "materials"},
    {"key": "materials-other", "name": "Materials (Other)", "sector": "materials"},
    {"key": "real-estate", "name": "Real Estate", "sector": "real-estate"},
    {"key": "internet-media", "name": "Internet & Media", "sector": "communication-services"},
    {"key": "telecom", "name": "Telecom", "sector": "communication-services"},
]

# Starter watchlist — edit freely. sector/industry reference taxonomy keys.
WATCHLIST: list[dict[str, Any]] = [
    {"ticker": "NVDA", "name": "NVIDIA Corporation", "sector": "technology", "industry": "semiconductors", "exchange": "NASDAQ",
     "why_added": "Core AI compute exposure.", "why_relevant": "Sets the pace for the AI/semis complex; data-center demand signal."},
    {"ticker": "MSFT", "name": "Microsoft Corporation", "sector": "technology", "industry": "software", "exchange": "NASDAQ",
     "why_added": "Cloud + AI platform leader.", "why_relevant": "Azure growth and AI monetization bellwether for enterprise software."},
    {"ticker": "AAPL", "name": "Apple Inc.", "sector": "technology", "industry": "hardware-devices", "exchange": "NASDAQ",
     "why_added": "Largest consumer hardware franchise.", "why_relevant": "Hardware demand and supply-chain signals ripple across devices."},
    {"ticker": "GOOGL", "name": "Alphabet Inc.", "sector": "communication-services", "industry": "internet-media", "exchange": "NASDAQ",
     "why_added": "Search/ads + AI research and cloud.", "why_relevant": "Ad-market health and AI competitive positioning."},
    {"ticker": "AMZN", "name": "Amazon.com, Inc.", "sector": "consumer-discretionary", "industry": "retail-ecommerce", "exchange": "NASDAQ",
     "why_added": "E-commerce + AWS cloud.", "why_relevant": "Consumer demand proxy and a leading cloud-infrastructure read."},
]


# --- Upsert helpers -----------------------------------------------------------


async def _upsert(session: AsyncSession, model: Any, rows: list[dict], *, index_elements: list[str], update: list[str]) -> int:
    if not rows:
        return 0
    stmt = insert(model).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=index_elements,
        set_={col: getattr(stmt.excluded, col) for col in update},
    )
    await session.execute(stmt)
    return len(rows)


async def seed_taxonomy(session: AsyncSession) -> tuple[int, int]:
    n_sectors = await _upsert(session, Sector, SECTORS, index_elements=["key"], update=["name"])
    sector_ids = {k: sid for sid, k in (await session.execute(select(Sector.id, Sector.key))).all()}
    industry_rows = [
        {"key": i["key"], "name": i["name"], "sector_id": sector_ids[i["sector"]]} for i in INDUSTRIES
    ]
    n_industries = await _upsert(
        session, Industry, industry_rows, index_elements=["key"], update=["name", "sector_id"]
    )
    return n_sectors, n_industries


async def seed_watchlist(session: AsyncSession) -> tuple[int, int]:
    sector_ids = {k: sid for sid, k in (await session.execute(select(Sector.id, Sector.key))).all()}
    industry_ids = {k: iid for iid, k in (await session.execute(select(Industry.id, Industry.key))).all()}

    company_rows = [
        {
            "ticker": c["ticker"],
            "name": c["name"],
            "sector_id": sector_ids.get(c.get("sector")),
            "industry_id": industry_ids.get(c.get("industry")),
            "exchange": c.get("exchange"),
            "coverage_tier": CoverageTier.watchlist,
        }
        for c in WATCHLIST
    ]
    n_companies = await _upsert(
        session, Company, company_rows, index_elements=["ticker"],
        update=["name", "sector_id", "industry_id", "exchange", "coverage_tier"],
    )

    company_ids = {tk: cid for cid, tk in (await session.execute(select(Company.id, Company.ticker))).all()}
    meta_rows = [
        {
            "company_id": company_ids[c["ticker"]],
            "why_added": c.get("why_added"),
            "why_relevant": c.get("why_relevant"),
            "thresholds": dict(DEFAULT_THRESHOLDS),
        }
        for c in WATCHLIST
    ]
    n_meta = await _upsert(
        session, WatchlistMetadata, meta_rows, index_elements=["company_id"],
        update=["why_added", "why_relevant", "thresholds"],
    )
    return n_companies, n_meta


async def seed_preferences(session: AsyncSession) -> int:
    row = {
        "id": 1,  # singleton
        "interested_sectors": ["technology", "industrials", "energy"],
        "pulse_user": [],  # user adds mega-caps later; pulse_core is in config
        "default_thresholds": dict(DEFAULT_THRESHOLDS),
        "channels": {
            "email": "jacoklii@icloud.com",
            "digest_channels": ["email", "in_app"],
            "pulse_channels": ["imessage", "in_app"],
        },
        "quiet_hours": {"start_hour_utc": 4, "end_hour_utc": 11},
    }
    await _upsert(
        session, UserPreferences, [row], index_elements=["id"],
        update=["interested_sectors", "pulse_user", "default_thresholds", "channels", "quiet_hours"],
    )
    return 1


async def run() -> None:
    async with SessionLocal() as session:
        sectors, industries = await seed_taxonomy(session)
        companies, meta = await seed_watchlist(session)
        prefs = await seed_preferences(session)
        await session.commit()

    print(
        "Seeded (idempotent): "
        f"{sectors} sectors, {industries} industries, "
        f"{companies} watchlist companies, {meta} watchlist-metadata rows, {prefs} preferences row."
    )


if __name__ == "__main__":
    asyncio.run(run())
