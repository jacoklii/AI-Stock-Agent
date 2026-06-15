"""API wire schemas — the request/response contract for the UI.

Per the project's separation rule these are distinct from ORM models (storage), JSONB payloads,
and tool DTOs (``tools/tool_schema.py``). They describe what's transmitted over HTTP. Freshness
fields (``generated_at`` / ``data_through``) ride along so the UI can show stale data as stale.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.db.enums import Channel, ChatRole, CoverageTier

# --- Shared ------------------------------------------------------------------


class ArticleOut(BaseModel):
    news_event_id: int
    url: str
    source: str | None
    published_at: datetime
    headline: str
    summary: str
    significance: float
    tickers: list[str]


class RelatedArticleOut(ArticleOut):
    """An article surfaced by semantic relatedness, carrying its cosine ``similarity`` (1 - dist)."""

    similarity: float


class RelatedSessionOut(BaseModel):
    """A past research session surfaced as related to another, with its cosine ``similarity``."""

    state_id: int
    topic: str
    status: Literal["open", "closed"]
    findings: str | None
    last_active_at: datetime
    similarity: float


# --- Brief (market brief: movers + snapshot) ---------------------------------


class BriefInstrumentOut(BaseModel):
    symbol: str
    label: str | None
    price: float | None
    change: float | None
    change_pct: float | None


class BriefStateOut(BaseModel):
    instruments: list[BriefInstrumentOut]


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
    kind: str
    score: float
    generated_at: datetime
    data_through: datetime | None


class ProseOut(BaseModel):
    kind: str
    body: str
    generated_at: datetime
    source_event_ids: list[int]


class CompanyDetail(BaseModel):
    company_id: int
    ticker: str
    name: str
    coverage_tier: CoverageTier
    sector: str | None
    industry_id: int | None
    exchange: str | None
    articles: list[ArticleOut]
    scores: list[ScoreOut]
    prose: list[ProseOut]


# --- Industry view -----------------------------------------------------------


class IndustryView(BaseModel):
    industry_id: int
    key: str
    name: str
    description: str | None
    articles: list[ArticleOut]


# --- Inbox -------------------------------------------------------------------


class InboxItem(BaseModel):
    id: int
    sent_at: datetime
    channel: Channel
    template: str | None
    ref_type: str | None
    ref_id: int | None
    title: str | None = None
    body: str | None = None
    read_at: datetime | None = None
    dismissed_at: datetime | None = None


# --- Preferences -------------------------------------------------------------


class ChannelsOut(BaseModel):
    """Wire mirror of the ``UserChannels`` JSONB payload (kept separate per the four-model rule)."""

    email: str | None = None
    imessage: str | None = None
    whatsapp: str | None = None
    digest_channels: list[str] = Field(default_factory=lambda: ["email", "in_app"])
    brief_channels: list[str] = Field(default_factory=lambda: ["imessage", "in_app"])


class ChannelsUpdate(ChannelsOut):
    @field_validator("digest_channels", "brief_channels")
    @classmethod
    def _known_channels(cls, names: list[str]) -> list[str]:
        valid = {c.value for c in Channel}
        unknown = [n for n in names if n not in valid]
        if unknown:
            raise ValueError(f"unknown channels: {unknown}; valid: {sorted(valid)}")
        return names


class PreferencesOut(BaseModel):
    interested_sectors: list[str]
    brief_user: list[str]
    critical_industries: list[int]
    weekly_token_budget: int | None = None
    channels: ChannelsOut | None = None


class BudgetUpdate(BaseModel):
    # None clears the cap (uncapped); the agent still records spend.
    weekly_token_budget: int | None = Field(default=None, ge=0)


# --- Action requests ----------------------------------------------------------


class WatchlistUpdate(BaseModel):
    action: Literal["promote", "demote"]


class IndustryFlagUpdate(BaseModel):
    flagged: bool


class BriefUserUpdate(BaseModel):
    symbols: list[str]


class FollowupRequest(BaseModel):
    query: str
    company_id: int | None = None
    industry_id: int | None = None


class FollowupResponse(BaseModel):
    answer: str
    sources: list[int] = []
    source_urls: list[str] = []


# --- Lists (Industries / watchlist views) -------------------------------------


class IndustryListItem(BaseModel):
    industry_id: int
    key: str
    name: str
    description: str | None
    flagged: bool


class CompanyListItem(BaseModel):
    company_id: int
    ticker: str
    name: str
    sector: str | None
    industry_id: int | None
    coverage_tier: CoverageTier


# --- Research sessions ---------------------------------------------------------


class ResearchSessionOut(BaseModel):
    state_id: int
    topic: str
    status: Literal["open", "closed"]
    current_task: str | None
    findings: str | None
    open_questions: str | None
    opened_at: datetime
    last_active_at: datetime
    closed_at: datetime | None
    parent_state_id: int | None


class TaskOut(BaseModel):
    id: int
    type: str
    status: str
    started_at: datetime | None
    completed_at: datetime | None
    error_message: str | None
    tokens_used: int | None
    state_id: int | None
    message: str | None = None
    counts: dict[str, int] = Field(default_factory=dict)


class ResearchSessionDetail(ResearchSessionOut):
    source_articles: list[ArticleOut] = Field(default_factory=list)
    source_urls: list[str] = Field(default_factory=list)
    tasks: list[TaskOut] = Field(default_factory=list)


class ResearchOpenRequest(BaseModel):
    topic: str = Field(min_length=3)
    company_id: int | None = None
    industry_id: int | None = None


class ResearchOpenResponse(BaseModel):
    state_id: int
    status: Literal["started"] = "started"


class ResearchCloseRequest(BaseModel):
    promote: bool = False


class ResearchCloseResponse(BaseModel):
    state_id: int
    promoted: bool
    closed: bool


class ResearchRedirectRequest(BaseModel):
    topic: str | None = None
    current_task: str | None = None


# --- Agent activity / budget ----------------------------------------------------


class ActivityOut(BaseModel):
    running: list[TaskOut]
    recent: list[TaskOut]


class BudgetOut(BaseModel):
    weekly_token_budget: int | None
    spent_7d: int
    remaining: int | None


# --- Chat -----------------------------------------------------------------------


class ChatMessageOut(BaseModel):
    id: int
    role: ChatRole
    content: str
    news_event_ids: list[int] = Field(default_factory=list)
    source_urls: list[str] = Field(default_factory=list)
    state_id: int | None = None
    created_at: datetime


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1)
    company_id: int | None = None
    industry_id: int | None = None


# --- Brief latest ----------------------------------------------------------------


class BriefLatestOut(BaseModel):
    title: str | None
    body: str | None
    sent_at: datetime
