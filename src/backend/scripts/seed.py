"""Seed the curated universe: critical industries vocabulary, a starter watchlist, and user preferences.

This is an ops script (top-level ``scripts/``, not inside ``app/``), per the repo structure note
about seeding a curated universe. The fixed ``brief_core`` set and default thresholds are NOT
seeded — they live in ``app/config.py`` and are read at runtime.

Every upsert is keyed on a natural key via ``ON CONFLICT ... DO UPDATE``, so re-running is safe
and converges to the constants below.

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
from app.db.models import Company, Industry, UserPreferences, WatchlistMetadata
from app.db.session import SessionLocal

# --- Curated constants --------------------------------------------------------

# Critical industries vocabulary — the user-editable set the agent tracks in depth.
# Organized by broad theme for readability; ``sector`` is stored as plain text on Company.
INDUSTRIES: list[dict[str, str]] = [
    {"key": "semiconductors", "name": "Semiconductors"},
    {"key": "ai-ml-infrastructure", "name": "AI & ML Infrastructure"},
    {"key": "software", "name": "Software"},
    {"key": "hardware-devices", "name": "Hardware & Devices"},
    {"key": "cybersecurity", "name": "Cybersecurity"},
    {"key": "cloud-data-centers", "name": "Cloud & Data Centers"},
    {"key": "aerospace", "name": "Aerospace"},
    {"key": "defense", "name": "Defense"},
    {"key": "oil-gas", "name": "Oil & Gas"},
    {"key": "renewables-clean-energy", "name": "Renewables & Clean Energy"},
    {"key": "biotech-pharma", "name": "Biotech & Pharma"},
    {"key": "medical-devices", "name": "Medical Devices"},
    {"key": "banks", "name": "Banks"},
    {"key": "fintech-payments", "name": "Fintech & Payments"},
    {"key": "capital-markets", "name": "Capital Markets"},
    {"key": "ev-autos", "name": "EV & Autos"},
    {"key": "retail-ecommerce", "name": "Retail & E-Commerce"},
    {"key": "internet-media", "name": "Internet & Media"},
    {"key": "telecom", "name": "Telecom"},
    {"key": "battery-critical-materials", "name": "Battery & Critical Materials"},
]

# Starter watchlist — edit freely. ``sector`` is plain text, ``industry`` is a key from above.
WATCHLIST: list[dict[str, Any]] = [
    {
        "ticker": "NVDA", "name": "NVIDIA Corporation",
        "sector": "Technology", "industry": "semiconductors", "exchange": "NASDAQ",
        "why_added": "Core AI compute exposure.",
        "why_relevant": "Sets the pace for the AI/semis complex; data-center demand signal.",
    },
    {
        "ticker": "MSFT", "name": "Microsoft Corporation",
        "sector": "Technology", "industry": "software", "exchange": "NASDAQ",
        "why_added": "Cloud + AI platform leader.",
        "why_relevant": "Azure growth and AI monetization bellwether for enterprise software.",
    },
    {
        "ticker": "AAPL", "name": "Apple Inc.",
        "sector": "Technology", "industry": "hardware-devices", "exchange": "NASDAQ",
        "why_added": "Largest consumer hardware franchise.",
        "why_relevant": "Hardware demand and supply-chain signals ripple across devices.",
    },
    {
        "ticker": "GOOGL", "name": "Alphabet Inc.",
        "sector": "Communication Services", "industry": "internet-media", "exchange": "NASDAQ",
        "why_added": "Search/ads + AI research and cloud.",
        "why_relevant": "Ad-market health and AI competitive positioning.",
    },
    {
        "ticker": "AMZN", "name": "Amazon.com, Inc.",
        "sector": "Consumer Discretionary", "industry": "retail-ecommerce", "exchange": "NASDAQ",
        "why_added": "E-commerce + AWS cloud.",
        "why_relevant": "Consumer demand proxy and a leading cloud-infrastructure read.",
    },
]


# --- Upsert helpers -----------------------------------------------------------


async def _upsert(
    session: AsyncSession,
    model: Any,
    rows: list[dict],
    *,
    index_elements: list[str],
    update: list[str],
) -> int:
    if not rows:
        return 0
    stmt = insert(model).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=index_elements,
        set_={col: getattr(stmt.excluded, col) for col in update},
    )
    await session.execute(stmt)
    return len(rows)


async def seed_industries(session: AsyncSession) -> int:
    rows = [{"key": i["key"], "name": i["name"], "is_active": True} for i in INDUSTRIES]
    return await _upsert(session, Industry, rows, index_elements=["key"], update=["name", "is_active"])


async def seed_watchlist(session: AsyncSession) -> tuple[int, int]:
    industry_ids = {
        k: iid
        for iid, k in (await session.execute(select(Industry.id, Industry.key))).all()
    }

    company_rows = [
        {
            "ticker": c["ticker"],
            "name": c["name"],
            "sector": c.get("sector"),
            "industry_id": industry_ids.get(c.get("industry")),
            "exchange": c.get("exchange"),
            "coverage_tier": CoverageTier.watchlist,
        }
        for c in WATCHLIST
    ]
    n_companies = await _upsert(
        session,
        Company,
        company_rows,
        index_elements=["ticker"],
        update=["name", "sector", "industry_id", "exchange", "coverage_tier"],
    )

    company_ids = {
        tk: cid
        for cid, tk in (await session.execute(select(Company.id, Company.ticker))).all()
    }
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
        session,
        WatchlistMetadata,
        meta_rows,
        index_elements=["company_id"],
        update=["why_added", "why_relevant", "thresholds"],
    )
    return n_companies, n_meta


async def seed_preferences(session: AsyncSession) -> int:
    row = {
        "id": 1,  # singleton
        "interested_sectors": ["Technology", "Industrials", "Energy"],
        "brief_user": [],  # user adds mega-caps later; brief_core is in config
        "critical_industries": [],  # user flags industries via the API
        "default_thresholds": dict(DEFAULT_THRESHOLDS),
        "channels": {
            "email": "jacoklii@icloud.com",
            "digest_channels": ["email", "in_app"],
            "brief_channels": ["imessage", "in_app"],
        },
        "quiet_hours": {"start_hour_utc": 4, "end_hour_utc": 11},
    }
    await _upsert(
        session,
        UserPreferences,
        [row],
        index_elements=["id"],
        update=[
            "interested_sectors",
            "brief_user",
            "critical_industries",
            "default_thresholds",
            "channels",
            "quiet_hours",
        ],
    )
    return 1


async def run() -> None:
    async with SessionLocal() as session:
        industries = await seed_industries(session)
        companies, meta = await seed_watchlist(session)
        prefs = await seed_preferences(session)
        await session.commit()

    print(
        "Seeded (idempotent): "
        f"{industries} industries, "
        f"{companies} watchlist companies, {meta} watchlist-metadata rows, {prefs} preferences row."
    )


if __name__ == "__main__":
    asyncio.run(run())
