"""API wire schemas — the request/response contract for the UI.

Per the project's separation rule these are distinct from ORM models (storage), JSONB payloads,
and tool DTOs (``tools/tool_schema.py``). They describe what's transmitted over HTTP. Freshness
fields (``generated_at`` / ``data_through``) ride along so the UI can show stale data as stale.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

from app.db.enums import Channel, CoverageTier, ProseKind, SignificanceTier

# --- Shared ------------------------------------------------------------------


class ArticleOut(BaseModel):
    news_event_id: int
    url: str
    source: str | None
    published_at: datetime
    headline: str
    summary: str
    significance_tier: SignificanceTier
    sentiment_score: float | None
    tickers: list[str]


# --- Pulse -------------------------------------------------------------------


class PulseInstrumentOut(BaseModel):
    symbol: str
    label: str | None
    price: float | None
    change: float | None
    change_pct: float | None


class PulseStateOut(BaseModel):
    instruments: list[PulseInstrumentOut]


class PulseRunOut(BaseModel):
    id: int
    slot: str
    generated_at: datetime
    pulse_snapshot: str | None
    instruments: list[PulseInstrumentOut]


# --- Digest / home -----------------------------------------------------------


class DigestSectionOut(BaseModel):
    section_title: str
    snapshot: str
    article_refs: list[int]
    key_tickers: list[str]


class DigestView(BaseModel):
    id: int
    generated_at: datetime
    top_snapshot: str | None
    sections: list[DigestSectionOut]
    source_event_ids: list[int]


# --- Company detail ----------------------------------------------------------


class ScoreOut(BaseModel):
    kind: ProseKind
    score: float
    generated_at: datetime
    data_through: datetime | None


class ProseOut(BaseModel):
    kind: ProseKind
    body: str
    generated_at: datetime
    citation_event_ids: list[int]


class CompanyDetail(BaseModel):
    company_id: int
    ticker: str
    name: str
    coverage_tier: CoverageTier
    sector_id: int | None
    industry_id: int | None
    exchange: str | None
    articles: list[ArticleOut]
    scores: list[ScoreOut]
    prose: list[ProseOut]


# --- Sector view -------------------------------------------------------------


class SectorAggregateOut(BaseModel):
    date: date
    etf_price: float | None
    breadth: float | None
    rolled_sentiment: float | None


class SectorView(BaseModel):
    sector_id: int
    key: str
    name: str
    aggregate: SectorAggregateOut | None
    articles: list[ArticleOut]


# --- Inbox -------------------------------------------------------------------


class InboxItem(BaseModel):
    id: int
    sent_at: datetime
    channel: Channel
    template: str | None
    ref_type: str | None
    ref_id: int | None
    read_at: datetime | None = None
    dismissed_at: datetime | None = None


# --- Preferences -------------------------------------------------------------


class PreferencesOut(BaseModel):
    interested_sectors: list[str]
    pulse_user: list[str]


# --- Action requests (handlers stubbed 501 this pass) ------------------------


class WatchlistUpdate(BaseModel):
    action: Literal["promote", "demote"]
    why_added: str | None = None
    why_relevant: str | None = None


class SectorFlagUpdate(BaseModel):
    flagged: bool


class PulseUserUpdate(BaseModel):
    symbols: list[str]


class FollowupRequest(BaseModel):
    query: str
    company_id: int | None = None
    sector_id: int | None = None


class FollowupResponse(BaseModel):
    answer: str
    sources: list[int] = []
