"""First-boot defaults — the platform initializes itself instead of shipping seed data.

``ensure_defaults`` is idempotent and runs in the API lifespan: it creates the singleton
``user_preferences`` row, the general industries vocabulary, and the popular mega-caps as
``discovered`` companies (lightweight tracking — deep scoring stays a watchlist decision).
Real *content* (news, analyses, scores) is never written here; the breadth pipelines produce
it from live sources. Everything seeded is user-editable afterwards.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select

from app.config import (
    DEFAULT_BRIEF_USER,
    DEFAULT_COMPANIES,
    DEFAULT_INDUSTRIES,
    DEFAULT_INTERESTED_SECTORS,
    DEFAULT_THRESHOLDS,
    DEFAULT_WEEKLY_TOKEN_BUDGET,
)
from app.db.models.companies import Company, Industry
from app.db.models.user import UserPreferences
from app.db.payloads import Thresholds, UserChannels
from app.db.session import SessionLocal


async def ensure_defaults(
    session_factory: async_sessionmaker[AsyncSession] = SessionLocal,
) -> dict[str, int]:
    """Create whatever default state is missing; return counts of what was created."""
    created = {"industries": 0, "companies": 0, "preferences": 0}
    async with session_factory() as session:
        # Industries vocabulary — insert missing keys only (user edits survive).
        existing_keys = set((await session.execute(select(Industry.key))).scalars())
        for spec in DEFAULT_INDUSTRIES:
            if spec["key"] not in existing_keys:
                session.add(
                    Industry(key=spec["key"], name=spec["name"], description=spec["description"])
                )
                created["industries"] += 1
        await session.flush()

        industry_ids: dict[str, int] = {
            key: industry_id
            for key, industry_id in (await session.execute(select(Industry.key, Industry.id))).all()
        }

        # Popular mega-caps as the starting research surface — never touches existing rows,
        # so promotions/demotions and user-added companies are preserved.
        existing_tickers = set((await session.execute(select(Company.ticker))).scalars())
        for spec in DEFAULT_COMPANIES:
            if spec["ticker"] not in existing_tickers:
                session.add(
                    Company(
                        ticker=spec["ticker"],
                        name=spec["name"],
                        sector=spec["sector"],
                        exchange=spec["exchange"],
                        industry_id=industry_ids.get(spec["industry"]),
                    )
                )
                created["companies"] += 1

        # Preferences singleton — created once with general defaults; afterwards Settings owns it.
        prefs = (
            await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
        ).scalar_one_or_none()
        if prefs is None:
            session.add(
                UserPreferences(
                    id=1,
                    interested_sectors=list(DEFAULT_INTERESTED_SECTORS),
                    brief_user=list(DEFAULT_BRIEF_USER),
                    default_thresholds=Thresholds(**DEFAULT_THRESHOLDS),
                    channels=UserChannels(),
                    weekly_token_budget=DEFAULT_WEEKLY_TOKEN_BUDGET,
                )
            )
            created["preferences"] = 1

        await session.commit()
    return created
