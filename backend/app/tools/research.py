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

from app.config import BRIEF_CORE
from app.db.enums import NewsDomain
from app.db.models.analysis import Analysis
from app.db.models.companies import Company
from app.db.models.market_data import Financial, Price
from app.db.models.news import NewsEvent
from app.db.models.state import ResearchState
from app.db.models.user import UserPreferences
from app.db.models.user_interest import UserInterest
from app.db.payloads import BriefInstrument
from app.providers.embeddings import EmbeddingsProvider
from app.providers.market import MarketDataProvider
from app.tools.registry import (
    TASK_COMPANY_PROSE,
    TASK_DEEP_RESEARCH,
    TASK_FOLLOWUP,
    TASK_PULSE_SNAPSHOT,
    TASK_SECTION_SNAPSHOT,
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
    SimilarHit,
    UserInterestHit,
)


def _f(value: object) -> float | None:
    return float(value) if value is not None else None  # type: ignore[arg-type]


@tool(
    name="get_company",
    description="Company identity + coverage tier, by ticker or company_id.",
    tasks={TASK_COMPANY_PROSE, TASK_SECTION_SNAPSHOT, TASK_TOP_SNAPSHOT, TASK_FOLLOWUP, TASK_DEEP_RESEARCH},
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
        sector=company.sector,
        industry_id=company.industry_id,
        exchange=company.exchange,
        coverage_tier=company.coverage_tier,
    )


@tool(
    name="get_financials",
    description="Financial-statement rows for a company, newest period first.",
    tasks={TASK_COMPANY_PROSE, TASK_FOLLOWUP, TASK_DEEP_RESEARCH},
    output_model=FinancialRow,
)
async def get_financials(
    session: AsyncSession,
    *,
    company_id: int,
    period_type: str | None = None,
    limit: int = 8,
) -> list[FinancialRow]:
    stmt = select(Financial).where(Financial.company_id == company_id)
    if period_type is not None:
        stmt = stmt.where(Financial.period_type == period_type)
    stmt = stmt.order_by(Financial.period_end.desc()).limit(limit)
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
    tasks={TASK_COMPANY_PROSE, TASK_PULSE_SNAPSHOT, TASK_FOLLOWUP, TASK_DEEP_RESEARCH},
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
    """Daily bars only. Intraday is a live, on-demand concern handled in the brief workflow."""
    stmt = select(Price).where(Price.company_id == company_id)
    if start is not None:
        stmt = stmt.where(Price.date >= start)
    if end is not None:
        stmt = stmt.where(Price.date <= end)
    stmt = stmt.order_by(Price.date.desc()).limit(limit)
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
    description="News events filtered by company, industry, surveillance domain, source country, "
    "and/or minimum significance. Pass industry_id to pull an industry's company-tagged events; "
    "pass domain (geopolitics|macro|industry|market) to pull a surveillance section's events; pass "
    "source_country (e.g. 'United States') to pull GDELT geopolitics events by geography.",
    tasks={
        TASK_SECTION_SNAPSHOT,
        TASK_COMPANY_PROSE,
        TASK_TOP_SNAPSHOT,
        TASK_FOLLOWUP,
        TASK_DEEP_RESEARCH,
    },
    output_model=NewsEventResult,
)
async def get_news_events(
    session: AsyncSession,
    *,
    company_id: int | None = None,
    industry_id: int | None = None,
    domain: NewsDomain | None = None,
    source_country: str | None = None,
    min_significance: float | None = None,
    limit: int = 50,
) -> list[NewsEventResult]:
    """Filter by company, industry, surveillance ``domain``, and/or ``source_country``.
    ``industry_id`` matches events tagged to that industry; ``domain`` matches the section a stored
    event was routed into; ``source_country`` matches the GDELT geographic attribution (geopolitics
    events). ``min_significance`` keeps events at or above the given score (0–1)."""
    stmt = select(NewsEvent)
    if company_id is not None:
        stmt = stmt.where(NewsEvent.company_id == company_id)
    if industry_id is not None:
        stmt = stmt.where(NewsEvent.industry_id == industry_id)
    if domain is not None:
        stmt = stmt.where(NewsEvent.domain == domain)
    if source_country is not None:
        stmt = stmt.where(NewsEvent.source_country == source_country)
    if min_significance is not None:
        stmt = stmt.where(NewsEvent.significance >= min_significance)
    stmt = stmt.order_by(NewsEvent.published_at.desc()).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        NewsEventResult(
            news_event_id=r.id,
            company_id=r.company_id,
            url=r.url,
            source=r.source,
            published_at=r.published_at,
            headline=r.headline,
            tickers=list(r.tickers),
            significance=r.significance,
            summary=r.summary,
            domain=r.domain.value if r.domain is not None else None,
            source_country=r.source_country,
        )
        for r in rows
    ]


@tool(
    name="screen_stocks",
    description="Parameterized screen over companies; ranked candidate list.",
    tasks={TASK_SECTION_SNAPSHOT, TASK_FOLLOWUP, TASK_DEEP_RESEARCH},
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
    if filters.sector is not None:
        stmt = stmt.where(Company.sector == filters.sector)
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
            sector=c.sector,
            industry_id=c.industry_id,
            coverage_tier=c.coverage_tier,
        )
        for c in rows
    ]


@tool(
    name="get_brief_state",
    description="Live quotes for the brief set (fixed core + user mega-caps).",
    tasks={TASK_PULSE_SNAPSHOT, TASK_TOP_SNAPSHOT},
    output_model=BriefInstrument,
)
async def get_brief_state(
    session: AsyncSession,
    market_provider: MarketDataProvider,
) -> list[BriefInstrument]:
    """Compose the brief set from ``BRIEF_CORE`` (config) + ``brief_user`` (preferences) and
    fetch live quotes via the yFinance wrapper. Read-only: persisting a brief is the brief
    workflow's job, not this tool's."""
    prefs = (
        await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
    ).scalar_one_or_none()
    user_symbols = list(prefs.brief_user) if prefs and prefs.brief_user else []

    labels: dict[str, str | None] = {item["symbol"]: item["label"] for item in BRIEF_CORE}
    symbols = [item["symbol"] for item in BRIEF_CORE]
    for sym in user_symbols:
        if sym not in labels:
            labels[sym] = None
            symbols.append(sym)

    quotes = await market_provider.get_quotes(symbols)
    return [
        BriefInstrument(
            symbol=q.symbol,
            label=labels.get(q.symbol),
            price=q.price,
            change=q.change,
            change_pct=q.change_pct,
        )
        for q in quotes
    ]


# Keep old name as alias for backward-compat with callers that haven't migrated yet.
get_pulse_state = get_brief_state


async def search_similar_by_vector(
    session: AsyncSession,
    model_cls,
    *,
    vector: list[float],
    model_name: str,
    k: int = 10,
    exclude_id: int | None = None,
):
    """Rank one embedded surface by cosine distance to an **existing** vector — no embed, no LLM.

    The shared core of the semantic searches and the read-only "related" API surfaces: when the
    query is already a stored embedding (a row's own vector), pass it straight in. Returns
    ``(orm_row, similarity)`` pairs ordered closest-first; only rows embedded with ``model_name``
    are comparable. ``exclude_id`` drops a row by id (e.g. the query row itself). Read-only —
    the caller projects the rows into its own DTO."""
    distance = model_cls.embedding.cosine_distance(vector)
    stmt = (
        select(model_cls, distance.label("distance"))
        .where(model_cls.embedding.is_not(None))
        .where(model_cls.embedding_model == model_name)
        .order_by(distance.asc())
        .limit(k)
    )
    if exclude_id is not None:
        stmt = stmt.where(model_cls.id != exclude_id)
    rows = (await session.execute(stmt)).all()
    return [(row, 1.0 - float(dist)) for row, dist in rows]


# Per-scope mapping for the generalized semantic search: model + how to project a hit.
# News carries no embedding (Alpha Vantage's structured tickers/topics replaced semantic news
# search), so the similar-scopes are the AI-written surfaces that still embed: analysis + state.
_SIMILAR_SCOPES = {
    "analysis": (Analysis, lambda r: (f"{r.type.value} analysis", None)),
    "state": (ResearchState, lambda r: (r.topic, r.findings)),
}


@tool(
    name="search_similar",
    description="Semantic search over stored analysis or research state (cosine).",
    tasks={TASK_FOLLOWUP, TASK_DEEP_RESEARCH},
    output_model=SimilarHit,
)
async def search_similar(
    session: AsyncSession,
    embeddings_provider: EmbeddingsProvider,
    *,
    query_text: str,
    scope: str = "analysis",
    k: int = 10,
) -> list[SimilarHit]:
    """Embed ``query_text`` with the fixed model and rank one embedded surface by cosine
    distance. ``scope`` is one of analysis | state. Only rows embedded with the same
    model are comparable."""
    if scope not in _SIMILAR_SCOPES:
        raise ValueError(f"scope must be one of {list(_SIMILAR_SCOPES)}")
    model, project = _SIMILAR_SCOPES[scope]
    embedded = await embeddings_provider.embed_query(query_text)
    hits = await search_similar_by_vector(
        session, model, vector=embedded.vector, model_name=embedded.model, k=k
    )
    out: list[SimilarHit] = []
    for row, similarity in hits:
        title, summary = project(row)
        out.append(
            SimilarHit(
                ref_type=scope,
                ref_id=row.id,
                title=title,
                summary=summary,
                similarity=similarity,
            )
        )
    return out


@tool(
    name="recall_preferences",
    description="Semantic recall over the user's own interests — the relevant slice of what THIS "
    "user finds valuable (the sectors/names they track, questions they've asked, topics they've "
    "opened). Call it when judging whether a finding or event matters, or what to surface.",
    tasks={
        TASK_DEEP_RESEARCH,
        TASK_FOLLOWUP,
        TASK_SECTION_SNAPSHOT,
        TASK_COMPANY_PROSE,
        TASK_TOP_SNAPSHOT,
        TASK_PULSE_SNAPSHOT,
    },
    output_model=UserInterestHit,
)
async def recall_preferences(
    session: AsyncSession,
    embeddings_provider: EmbeddingsProvider,
    *,
    query_text: str,
    k: int = 5,
) -> list[UserInterestHit]:
    """Embed ``query_text`` and return the user-interest lines closest to it by cosine distance —
    only the relevant slice, not the whole corpus. Mirrors ``search_similar``: only rows embedded
    with the same model are comparable. Empty when the corpus has no comparable rows yet."""
    embedded = await embeddings_provider.embed_query(query_text)
    distance = UserInterest.embedding.cosine_distance(embedded.vector)
    stmt = (
        select(UserInterest, distance.label("distance"))
        .where(UserInterest.embedding.is_not(None))
        .where(UserInterest.embedding_model == embedded.model)
        .order_by(distance.asc())
        .limit(k)
    )
    rows = (await session.execute(stmt)).all()
    return [
        UserInterestHit(kind=row.kind, text=row.text, similarity=1.0 - float(dist))
        for row, dist in rows
    ]
