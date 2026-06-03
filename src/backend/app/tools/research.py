"""Research / market read tools.

Predefined, read-only functions over the data layer (plus the two provider wrappers for the
genuinely live reads). Each takes an injected ``AsyncSession`` — callers pass a
``readonly_session()`` so a write is impossible at the database — and returns a typed result
model, never an ORM row and never free-form text. ``company_id`` is the join key everywhere;
``ticker`` is only an input convenience on ``get_company``.
"""

from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import PULSE_CORE
from app.db.enums import SignificanceTier
from app.db.models.companies import Company
from app.db.models.market_data import FinancialData, PriceHistory
from app.db.models.news import NewsEvent
from app.db.models.user import UserPreferences
from app.db.payloads import PulseInstrument
from app.providers.embeddings import EmbeddingsProvider
from app.providers.market import MarketDataProvider
from app.tools.registry import (
    TASK_ARTICLE_SUMMARY,
    TASK_COMPANY_PROSE,
    TASK_FOLLOWUP,
    TASK_PULSE_SNAPSHOT,
    TASK_SECTION_SNAPSHOT,
    TASK_SIGNIFICANCE,
    TASK_TOP_SNAPSHOT,
    tool,
)
from app.tools.tool_schema import (
    CompanyResult,
    FinancialRow,
    NewsEventResult,
    PriceRow,
    ScreenCandidate,
    ScreenFilters,
    SimilarEvent,
)

# Significance ordering for "at least this tier" filters. Closed set, defined once.
_SIGNIFICANCE_RANK: dict[SignificanceTier, int] = {
    SignificanceTier.routine: 0,
    SignificanceTier.notable: 1,
    SignificanceTier.significant: 2,
}


# --- Helpers ------------------------------------------------------------------


def _f(value: object) -> float | None:
    return float(value) if value is not None else None  # type: ignore[arg-type]


# --- Tools --------------------------------------------------------------------


@tool(
    name="get_company",
    description="Company identity + coverage tier, by ticker or company_id.",
    tasks={TASK_COMPANY_PROSE, TASK_SECTION_SNAPSHOT, TASK_TOP_SNAPSHOT, TASK_FOLLOWUP},
    output_model=CompanyResult,
)
async def get_company(
    session: AsyncSession,
    *,
    company_id: int | None = None,
    ticker: str | None = None,
) -> CompanyResult | None:
    """Look up one company. Exactly one of ``company_id`` / ``ticker`` must be given."""
    if (company_id is None) == (ticker is None):
        raise ValueError("provide exactly one of company_id or ticker")
    stmt = select(Company)
    stmt = stmt.where(Company.id == company_id) if company_id is not None else stmt.where(
        Company.ticker == ticker
    )
    company = (await session.execute(stmt)).scalar_one_or_none()
    if company is None:
        return None
    return CompanyResult(
        company_id=company.id,
        ticker=company.ticker,
        name=company.name,
        sector_id=company.sector_id,
        industry_id=company.industry_id,
        exchange=company.exchange,
        coverage_tier=company.coverage_tier,
    )


@tool(
    name="get_financials",
    description="Financial-statement rows for a company, newest period first.",
    tasks={TASK_COMPANY_PROSE, TASK_FOLLOWUP},
    output_model=FinancialRow,
)
async def get_financials(
    session: AsyncSession,
    *,
    company_id: int,
    period_type: str | None = None,
    limit: int = 8,
) -> list[FinancialRow]:
    stmt = select(FinancialData).where(FinancialData.company_id == company_id)
    if period_type is not None:
        stmt = stmt.where(FinancialData.period_type == period_type)
    stmt = stmt.order_by(FinancialData.period_end.desc()).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        FinancialRow(
            period_end=r.period_end,
            period_type=r.period_type.value,
            price=_f(r.price),
            market_cap=_f(r.market_cap),
            pe=r.pe,
            eps=r.eps,
            capex=_f(r.capex),
            ebitda=_f(r.ebitda),
            revenue=_f(r.revenue),
            net_income=_f(r.net_income),
        )
        for r in rows
    ]


@tool(
    name="get_price_history",
    description="Stored daily OHLCV for a company over an optional date range.",
    tasks={TASK_COMPANY_PROSE, TASK_PULSE_SNAPSHOT, TASK_FOLLOWUP},
    output_model=PriceRow,
)
async def get_price_history(
    session: AsyncSession,
    *,
    company_id: int,
    start: date | None = None,
    end: date | None = None,
    limit: int = 365,
) -> list[PriceRow]:
    """Daily bars only. Intraday is a live, on-demand concern handled in the pulse workflow,
    not stored and not served here."""
    stmt = select(PriceHistory).where(PriceHistory.company_id == company_id)
    if start is not None:
        stmt = stmt.where(PriceHistory.date >= start)
    if end is not None:
        stmt = stmt.where(PriceHistory.date <= end)
    stmt = stmt.order_by(PriceHistory.date.desc()).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        PriceRow(
            date=r.date,
            open=_f(r.open),
            high=_f(r.high),
            low=_f(r.low),
            close=_f(r.close),
            adj_close=_f(r.adj_close),
            volume=int(r.volume) if r.volume is not None else None,
        )
        for r in rows
    ]


@tool(
    name="get_news_events",
    description="News events for a company or sector, filtered by minimum significance.",
    tasks={
        TASK_ARTICLE_SUMMARY,
        TASK_SIGNIFICANCE,
        TASK_SECTION_SNAPSHOT,
        TASK_COMPANY_PROSE,
        TASK_TOP_SNAPSHOT,
        TASK_FOLLOWUP,
    },
    output_model=NewsEventResult,
)
async def get_news_events(
    session: AsyncSession,
    *,
    company_id: int | None = None,
    industry_id: int | None = None,
    min_significance: SignificanceTier | None = None,
    limit: int = 50,
) -> list[NewsEventResult]:
    """Filter by company or industry (the "who gets affected" key). ``min_significance``
    keeps events at or above the given tier."""
    stmt = select(NewsEvent)
    if company_id is not None:
        stmt = stmt.where(NewsEvent.company_id == company_id)
    if industry_id is not None:
        stmt = stmt.where(NewsEvent.industry_id == industry_id)
    if min_significance is not None:
        allowed = [
            tier
            for tier, rank in _SIGNIFICANCE_RANK.items()
            if rank >= _SIGNIFICANCE_RANK[min_significance]
        ]
        stmt = stmt.where(NewsEvent.significance_tier.in_(allowed))
    stmt = stmt.order_by(NewsEvent.published_at.desc()).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        NewsEventResult(
            news_event_id=r.id,
            company_id=r.company_id,
            industry_id=r.industry_id,
            url=r.url,
            source=r.source,
            published_at=r.published_at,
            headline=r.headline,
            tickers=list(r.tickers),
            sentiment_score=r.sentiment_score,
            significance_tier=r.significance_tier,
            summary=r.summary,
        )
        for r in rows
    ]


@tool(
    name="screen_stocks",
    description="Parameterized screen over companies; ranked candidate list.",
    tasks={TASK_SECTION_SNAPSHOT, TASK_FOLLOWUP},
    input_model=ScreenFilters,
    output_model=ScreenCandidate,
)
async def screen_stocks(
    session: AsyncSession,
    *,
    filters: ScreenFilters,
) -> list[ScreenCandidate]:
    """Typed-filter screen. The agent fills a ``ScreenFilters``; it never writes the SQL."""
    stmt = select(Company)
    if filters.sector_id is not None:
        stmt = stmt.where(Company.sector_id == filters.sector_id)
    if filters.industry_id is not None:
        stmt = stmt.where(Company.industry_id == filters.industry_id)
    if filters.coverage_tier is not None:
        stmt = stmt.where(Company.coverage_tier == filters.coverage_tier)
    if filters.exchange is not None:
        stmt = stmt.where(Company.exchange == filters.exchange)
    stmt = stmt.order_by(Company.ticker.asc()).limit(filters.limit)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        ScreenCandidate(
            company_id=c.id,
            ticker=c.ticker,
            name=c.name,
            sector_id=c.sector_id,
            industry_id=c.industry_id,
            coverage_tier=c.coverage_tier,
        )
        for c in rows
    ]


@tool(
    name="get_pulse_state",
    description="Live quotes for the pulse set (fixed core + user mega-caps).",
    tasks={TASK_PULSE_SNAPSHOT, TASK_TOP_SNAPSHOT},
    output_model=PulseInstrument,
)
async def get_pulse_state(
    session: AsyncSession,
    market_provider: MarketDataProvider,
) -> list[PulseInstrument]:
    """Compose the pulse set from ``PULSE_CORE`` (config) + ``pulse_user`` (preferences) and
    fetch live quotes via the yFinance wrapper. Read-only: persisting a pulse is the pulse
    workflow's job, not this tool's."""
    prefs = (
        await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
    ).scalar_one_or_none()
    user_symbols = list(prefs.pulse_user) if prefs and prefs.pulse_user else []

    labels: dict[str, str | None] = {item["symbol"]: item["label"] for item in PULSE_CORE}
    symbols = [item["symbol"] for item in PULSE_CORE]
    for sym in user_symbols:
        if sym not in labels:
            labels[sym] = None
            symbols.append(sym)

    quotes = await market_provider.get_quotes(symbols)
    return [
        PulseInstrument(
            symbol=q.symbol,
            label=labels.get(q.symbol),
            price=q.price,
            change=q.change,
            change_pct=q.change_pct,
        )
        for q in quotes
    ]


@tool(
    name="search_similar_events",
    description="Semantic search over stored news summaries (cosine).",
    tasks={TASK_SIGNIFICANCE, TASK_SECTION_SNAPSHOT, TASK_COMPANY_PROSE, TASK_FOLLOWUP},
    output_model=SimilarEvent,
)
async def search_similar_events(
    session: AsyncSession,
    embeddings_provider: EmbeddingsProvider,
    *,
    query_text: str,
    k: int = 10,
) -> list[SimilarEvent]:
    """Embed ``query_text`` with the fixed model and rank stored summary embeddings by cosine
    distance. Only events embedded with the same model are comparable, so results are scoped
    to that model name."""
    embedded = await embeddings_provider.embed_query(query_text)
    distance = NewsEvent.embedding.cosine_distance(embedded.vector)
    stmt = (
        select(NewsEvent, distance.label("distance"))
        .where(NewsEvent.embedding.is_not(None))
        .where(NewsEvent.embedding_model == embedded.model)
        .order_by(distance.asc())
        .limit(k)
    )
    rows = (await session.execute(stmt)).all()
    return [
        SimilarEvent(
            news_event_id=event.id,
            headline=event.headline,
            published_at=event.published_at,
            significance_tier=event.significance_tier,
            summary=event.summary,
            similarity=1.0 - float(dist),
        )
        for event, dist in rows
    ]
