"""Read-only tool smoke tests.

Run against the migrated Postgres (docker-compose), seeded taxonomy for valid FKs. Each test
flushes its fixtures, exercises a tool through its typed contract, and rolls back so the DB is
left untouched. Network providers (yFinance, Voyage) are replaced by in-memory fakes so these
tests stay deterministic and offline.
"""

from __future__ import annotations

from datetime import datetime, timezone

import pytest
from sqlalchemy import select

from app.config import get_settings
from app.db.enums import CoverageTier, SignificanceTier
from app.db.models import Company, Industry, NewsEvent, Sector
from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import EmbeddingResult
from app.providers.market import Quote
from app.tools.research import (
    get_company,
    get_news_events,
    get_pulse_state,
    search_similar_events,
)


class _FakeEmbeddings:
    """Returns a fixed vector + the configured model name (no network)."""

    def __init__(self, vector: list[float], model: str) -> None:
        self._vector = vector
        self._model = model

    async def embed_query(self, text: str) -> EmbeddingResult:
        return EmbeddingResult(vector=self._vector, model=self._model)


class _FakeMarket:
    """Echoes a canned quote per requested symbol, preserving order."""

    async def get_quotes(self, symbols: list[str]) -> list[Quote]:
        return [Quote(symbol=s, price=100.0, previous_close=99.0, change=1.0, change_pct=1.01) for s in symbols]


async def _seed_company_with_event(session, *, dim: int, model: str):
    sector = (await session.execute(select(Sector).where(Sector.key == "technology"))).scalar_one()
    industry = (
        await session.execute(select(Industry).where(Industry.key == "semiconductors"))
    ).scalar_one()
    company = Company(
        ticker="TOOL.TEST",
        name="Tool Test Co",
        sector_id=sector.id,
        industry_id=industry.id,
        coverage_tier=CoverageTier.watchlist,
    )
    session.add(company)
    await session.flush()

    event = NewsEvent(
        company_id=company.id,
        industry_id=industry.id,
        url="https://example.com/tool",
        source="unit-test",
        published_at=datetime.now(timezone.utc),
        headline="Tool headline",
        tickers=["TOOL.TEST"],
        sentiment_score=0.4,
        significance_tier=SignificanceTier.significant,
        summary="Canonical summary for tool tests.",
        embedding=[0.1] * dim,
        embedding_model=model,
    )
    session.add(event)
    await session.flush()
    return company, event


async def test_get_company_by_ticker_and_id():
    async with SessionLocal() as session:
        settings = get_settings()
        company, _ = await _seed_company_with_event(
            session, dim=settings.embedding_dim, model=settings.embedding_model
        )

        by_ticker = await get_company(session, ticker="TOOL.TEST")
        assert by_ticker is not None
        assert by_ticker.company_id == company.id
        assert by_ticker.coverage_tier is CoverageTier.watchlist

        by_id = await get_company(session, company_id=company.id)
        assert by_id is not None and by_id.ticker == "TOOL.TEST"

        with pytest.raises(ValueError):
            await get_company(session)  # neither identifier

        await session.rollback()


async def test_get_news_events_significance_filter():
    async with SessionLocal() as session:
        settings = get_settings()
        company, event = await _seed_company_with_event(
            session, dim=settings.embedding_dim, model=settings.embedding_model
        )

        hits = await get_news_events(
            session, company_id=company.id, min_significance=SignificanceTier.significant
        )
        assert [h.news_event_id for h in hits] == [event.id]
        assert hits[0].summary == "Canonical summary for tool tests."

        # Raising the bar above 'significant' is impossible; lowering it still includes it.
        notable_and_up = await get_news_events(
            session, company_id=company.id, min_significance=SignificanceTier.notable
        )
        assert event.id in [h.news_event_id for h in notable_and_up]

        await session.rollback()


async def test_search_similar_events_uses_query_embedding():
    async with SessionLocal() as session:
        settings = get_settings()
        _, event = await _seed_company_with_event(
            session, dim=settings.embedding_dim, model=settings.embedding_model
        )
        # Query vector identical to the stored one -> cosine similarity 1.0, top hit.
        fake = _FakeEmbeddings([0.1] * settings.embedding_dim, settings.embedding_model)

        hits = await search_similar_events(session, fake, query_text="anything", k=5)
        assert hits, "expected the seeded event to be retrievable"
        assert hits[0].news_event_id == event.id
        assert hits[0].similarity == pytest.approx(1.0, abs=1e-4)

        await session.rollback()


async def test_get_pulse_state_composes_core_and_user():
    async with SessionLocal() as session:
        from app.config import PULSE_CORE

        instruments = await get_pulse_state(session, _FakeMarket())
        symbols = [i.symbol for i in instruments]
        # Every fixed-core symbol is present and labelled from config.
        for item in PULSE_CORE:
            assert item["symbol"] in symbols
        labelled = {i.symbol: i.label for i in instruments}
        assert labelled[PULSE_CORE[0]["symbol"]] == PULSE_CORE[0]["label"]
        assert all(i.price == 100.0 for i in instruments)

        await session.rollback()


async def test_readonly_session_blocks_writes():
    async with readonly_session() as session:
        session.add(Company(ticker="RO.TEST", name="Should Fail", coverage_tier=CoverageTier.discovered))
        with pytest.raises(Exception):
            await session.flush()  # read-only transaction rejects the INSERT
        await session.rollback()
