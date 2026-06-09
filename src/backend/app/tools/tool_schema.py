"""Tool contracts — the typed inputs and result models for the read tools.

These are **tool-layer DTOs**, deliberately distinct from the other three model kinds:
- ORM models (``db/models/``) describe what's *stored* (tables);
- JSONB payloads (``db/payloads.py``) describe a variable *column's* persistence shape;
- API schemas (``api/``) describe what's *transmitted* over wire.

A tool contract is none of those: it's what a tool *hands back to its caller* (the agent or a
workflow). It must never be an ORM row — returning a mapped instance would leak the storage
shape into the AI's contract and drag session/lazy-load state across boundaries — so each tool
returns a plain, serializable projection defined here.
"""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel

from app.db.enums import Channel, CoverageTier

# ==============================================================================
# Inputs
# ==============================================================================


class ScreenFilters(BaseModel):
    """Typed inputs for ``screen_stocks`` — a parameterized screen, never AI-authored SQL."""

    sector: str | None = None
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
    sector: str | None
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
    url: str
    source: str | None
    published_at: datetime
    headline: str
    tickers: list[str]
    significance: float
    summary: str


class SimilarEvent(BaseModel):
    """A semantic-search hit: the event plus its cosine *similarity* (1 - distance)."""

    news_event_id: int
    headline: str
    published_at: datetime
    significance: float
    summary: str
    similarity: float


class ScreenCandidate(BaseModel):
    company_id: int
    ticker: str
    name: str
    sector: str | None
    industry_id: int | None
    coverage_tier: CoverageTier


# --- Analysis: scores + prose ------------------------------------------------


class ScoreRow(BaseModel):
    score: float
    scores: dict[str, float] | None
    rubric_version: str
    model_name: str
    generated_at: datetime
    data_through: datetime | None


class LatestScores(BaseModel):
    """Newest score on each axis (either may be absent for out-of-scope companies)."""

    company_id: int
    fundamental: ScoreRow | None
    sentimental: ScoreRow | None


class SourceRef(BaseModel):
    news_event_id: int | None
    source_ref: str | None


class ProseRow(BaseModel):
    prose_id: int
    body: str
    model_name: str
    generated_at: datetime
    data_through: datetime | None
    sources: list[SourceRef]


# --- Delivery ----------------------------------------------------------------


class DedupeResult(BaseModel):
    content_hash: str
    already_sent: bool
    channel: Channel | None = None
    sent_at: datetime | None = None
