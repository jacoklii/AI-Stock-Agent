"""Tool contracts — the typed inputs and result models for the read tools.

These are **tool-layer DTOs**, deliberately distinct from the other three model kinds:
- ORM models (``db/models/``) describe what's *stored* (tables);
- JSONB payloads (``db/payloads.py``) describe a variable *column's* persistence shape;
- API schemas (``api/``) describe what's *transmitted* over the wire.

A tool contract is none of those: it's what a tool *hands back to its caller* (the agent or a
workflow). It must never be an ORM row — returning a mapped instance would leak the storage
shape into the AI's contract and drag session/lazy-load state across boundaries — so each tool
returns a plain, serializable projection defined here. (Result shapes that genuinely *are* a
persistence shape, like ``PulseInstrument``, are imported from ``db/payloads.py`` instead, not
duplicated here.)

Resemblance to an ORM model (e.g. ``FinancialRow`` vs ``FinancialData``) is expected: a read
tool flattens a stored row into a JSON-friendly view (Decimal -> float, no FK/PK/timestamps).
Similar fields, different concern.
"""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel

from app.db.enums import Channel, CoverageTier, ProseKind, SignificanceTier

# ==============================================================================
# Inputs
# ==============================================================================
# Principle: a tool's input parameters are expressed as a typed Pydantic model, not bare
# keyword arguments. The model makes the contract explicit and validatable — the agent fills a
# structured object the tool can trust, rather than the tool parsing loose kwargs — and it's the
# same contract the MCP layer publishes. ``ScreenFilters`` is the canonical example: a
# parameterized screen whose filters travel as one validated unit (and never as AI-authored SQL).


class ScreenFilters(BaseModel):
    """Typed inputs for ``screen_stocks`` — a parameterized screen, never AI-authored SQL."""

    sector_id: int | None = None
    industry_id: int | None = None
    coverage_tier: CoverageTier | None = None
    exchange: str | None = None
    limit: int = 50


# ==============================================================================
# Results
# ==============================================================================

# --- Research / market -------------------------------------------------------


class CompanyResult(BaseModel):
    company_id: int
    ticker: str
    name: str
    sector_id: int | None
    industry_id: int | None
    exchange: str | None
    coverage_tier: CoverageTier


class FinancialRow(BaseModel):
    period_end: date
    period_type: str
    price: float | None
    market_cap: float | None
    pe: float | None
    eps: float | None
    capex: float | None
    ebitda: float | None
    revenue: float | None
    net_income: float | None


class PriceRow(BaseModel):
    date: date
    open: float | None
    high: float | None
    low: float | None
    close: float | None
    adj_close: float | None
    volume: int | None


class NewsEventResult(BaseModel):
    news_event_id: int
    company_id: int | None
    industry_id: int | None
    url: str
    source: str | None
    published_at: datetime
    headline: str
    tickers: list[str]
    sentiment_score: float | None
    significance_tier: SignificanceTier
    summary: str


class SimilarEvent(BaseModel):
    """A semantic-search hit: the event plus its cosine *similarity* (1 - distance)."""

    news_event_id: int
    headline: str
    published_at: datetime
    significance_tier: SignificanceTier
    summary: str
    similarity: float


class ScreenCandidate(BaseModel):
    company_id: int
    ticker: str
    name: str
    sector_id: int | None
    industry_id: int | None
    coverage_tier: CoverageTier


# --- Analysis: scores + prose ------------------------------------------------


class ScoreRow(BaseModel):
    kind: ProseKind
    score: float
    components: dict[str, float] | None
    rubric_version: str
    model_name: str
    generated_at: datetime
    data_through: datetime | None


class LatestScores(BaseModel):
    """Newest score on each axis (either may be absent for out-of-scope companies)."""

    company_id: int
    fundamental: ScoreRow | None
    sentimental: ScoreRow | None


class CitationRef(BaseModel):
    news_event_id: int | None
    source_ref: str | None


class ProseRow(BaseModel):
    prose_id: int
    kind: ProseKind
    body: str
    model_name: str
    generated_at: datetime
    data_through: datetime | None
    citations: list[CitationRef]


# --- Delivery ----------------------------------------------------------------


class DedupeResult(BaseModel):
    dedupe_key: str
    already_sent: bool
    channel: Channel | None = None
    sent_at: datetime | None = None
