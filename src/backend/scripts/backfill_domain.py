"""Backfill ``news_events.domain`` for rows written before the column existed.

Uses the deterministic keyword router (no LLM, no cost) — the same fallback /world used before the
column landed — so the feed reads a stored, indexable domain instead of classifying per request.
New events get the classifier's call at ingest; this only fills the historical gap.

Run once after ``alembic upgrade head``:

    python -m scripts.backfill_domain          # fill rows where domain IS NULL
    python -m scripts.backfill_domain --all     # re-classify every row
"""

from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import select

from app.config import WORLD_GEOPOLITICS_KEYWORDS, WORLD_MACRO_KEYWORDS
from app.db.enums import NewsDomain
from app.db.models.news import NewsEvent
from app.db.session import SessionLocal
from app.utils import classify_domain


async def run(*, only_missing: bool = True) -> int:
    updated = 0
    async with SessionLocal() as session:
        stmt = select(NewsEvent)
        if only_missing:
            stmt = stmt.where(NewsEvent.domain.is_(None))
        rows = (await session.execute(stmt)).scalars().all()
        for e in rows:
            key = classify_domain(
                f"{e.headline} {e.summary}",
                has_company=e.company_id is not None,
                has_industry=e.industry_id is not None,
                geopolitics_keywords=WORLD_GEOPOLITICS_KEYWORDS,
                macro_keywords=WORLD_MACRO_KEYWORDS,
            )
            e.domain = NewsDomain(key)
            updated += 1
        await session.commit()
    return updated


def main() -> None:
    parser = argparse.ArgumentParser(description="Backfill news_events.domain via the keyword router.")
    parser.add_argument("--all", action="store_true", help="re-classify every row, not just NULLs")
    args = parser.parse_args()
    count = asyncio.run(run(only_missing=not args.all))
    print(f"backfilled domain on {count} news_events row(s)")


if __name__ == "__main__":
    main()
