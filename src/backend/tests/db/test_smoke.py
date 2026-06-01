"""End-to-end smoke test for the data layer.

Runs against the migrated Postgres (docker-compose) and exercises the three things most
likely to break: FK joins on the company spine, a pgvector embedding column carrying its
model name, and a typed-JSONB payload round-tripping through its Pydantic model. Uses the
seeded taxonomy for valid FKs and rolls everything back, so the DB is left untouched.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select

from app.config import get_settings
from app.db.enums import CoverageTier, SignificanceTier
from app.db.models import Company, Industry, NewsEvent, ReadingListRun, Sector
from app.db.payloads import ArticleRef, DigestSection
from app.db.session import SessionLocal


async def test_data_layer_roundtrip():
    settings = get_settings()
    dim = settings.embedding_dim

    async with SessionLocal() as session:
        # Valid FKs come from the seeded taxonomy.
        sector = (await session.execute(select(Sector).where(Sector.key == "technology"))).scalar_one()
        industry = (
            await session.execute(select(Industry).where(Industry.key == "semiconductors"))
        ).scalar_one()
        assert industry.sector_id == sector.id  # taxonomy wired correctly

        # Company spine — join is on company_id, never ticker.
        company = Company(
            ticker="SMOKE.TEST",
            name="Smoke Test Co",
            sector_id=sector.id,
            industry_id=industry.id,
            coverage_tier=CoverageTier.discovered,
        )
        session.add(company)
        await session.flush()
        assert company.id is not None
        assert company.coverage_tier is CoverageTier.discovered  # PG enum -> Python enum

        # News event with an embedding that carries its model name.
        event = NewsEvent(
            company_id=company.id,
            industry_id=industry.id,
            url="https://example.com/smoke",
            source="unit-test",
            published_at=datetime.now(timezone.utc),
            headline="Smoke headline",
            tickers=["SMOKE.TEST"],
            sentiment_score=0.25,
            significance_tier=SignificanceTier.notable,
            summary="Canonical summary (no raw body stored).",
            embedding=[0.1] * dim,
            embedding_model=settings.embedding_model,
        )
        session.add(event)
        await session.flush()
        assert event.id is not None

        # Typed JSONB: write Pydantic models, expect Pydantic models back.
        run = ReadingListRun(
            top_snapshot="Top snapshot",
            sections=[
                DigestSection(
                    section_title="Technology",
                    snapshot="Sector snapshot",
                    article_refs=[ArticleRef(news_event_id=event.id, rank=1)],
                    key_tickers=["SMOKE.TEST"],
                )
            ],
            source_event_ids=[event.id],
        )
        session.add(run)
        await session.flush()

        # Capture PKs before expiring — after expire_all, touching an expired attribute
        # would trigger an (illegal) sync lazy-load in async context.
        event_id, run_id = event.id, run.id

        # Force a reload so values come back through the column type decoders.
        session.expire_all()

        fetched_event = (
            await session.execute(select(NewsEvent).where(NewsEvent.id == event_id))
        ).scalar_one()
        assert fetched_event.embedding_model == settings.embedding_model
        assert len(list(fetched_event.embedding)) == dim

        fetched_run = (
            await session.execute(select(ReadingListRun).where(ReadingListRun.id == run_id))
        ).scalar_one()
        assert isinstance(fetched_run.sections, list)
        assert isinstance(fetched_run.sections[0], DigestSection)  # parsed back to the model
        assert fetched_run.sections[0].article_refs[0].news_event_id == event_id
        assert fetched_run.sections[0].key_tickers == ["SMOKE.TEST"]
        assert fetched_run.source_event_ids == [event_id]

        # Leave the database exactly as we found it (seed-only).
        await session.rollback()
