"""API wire schemas — the request/response contract for the UI.

Per the project's separation rule these are distinct from ORM models (storage), JSONB payloads,
and tool DTOs (``tools/tool_schema.py``). They describe what's transmitted over HTTP. Freshness
fields (``generated_at`` / ``data_through``) ride along so the UI can show stale data as stale.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.db.enums import Channel, ChatRole, CoverageTier
from app.utils import Horizon, WorldDomainKey

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


# --- World surveillance feed (GET /world) ------------------------------------
# The always-on middle view. Ordered top-down by where market moves originate; every item leads
# with the fact + numbers (the read/chain/reports sit behind the UI's expand). `origin` keeps the
# two-engine distinction honest ("swept" by the scraper vs "researched" by the agent), and
# significance is surfaced only as a time `horizon` — the raw score is never sent.

WorldOrigin = Literal["swept", "researched"]


class WorldItem(BaseModel):
    title: str                 # the fact + numbers — leads
    detail: str | None = None  # the agent's read / context — deferred to the expand
    horizon: Horizon
    origin: WorldOrigin
    published_at: datetime | None = None
    source_url: str | None = None
    article_refs: list[int] = Field(default_factory=list)
    tickers: list[str] = Field(default_factory=list)


class WorldDomain(BaseModel):
    key: WorldDomainKey
    title: str
    # The agent's per-section synthesis (from section_summary); null until it has run for this domain.
    summary: str | None = None
    key_tickers: list[str] = Field(default_factory=list)
    items: list[WorldItem] = Field(default_factory=list)


class WorldSignal(BaseModel):
    """A ranked movement for the Signals band — chain (origin→mechanism→effect) is enriched later."""

    title: str
    horizon: Horizon
    origin: WorldOrigin
    source_url: str | None = None
    tickers: list[str] = Field(default_factory=list)


class WorldView(BaseModel):
    generated_at: datetime
    # The agent's cross-domain synthesis (reuses the latest digest); null when none exists yet.
    overview: DigestView | None = None
    # Geopolitics → Macro → Industry → Market, in that fixed order.
    domains: list[WorldDomain] = Field(default_factory=list)
    signals_now: list[WorldSignal] = Field(default_factory=list)
    signals_building: list[WorldSignal] = Field(default_factory=list)


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


class FinancialOut(BaseModel):
    """One reporting period's headline figures — facts only, no valuation call. Point-in-time
    fields (``price``/``market_cap``/``pe``) are present only on the most recent period."""

    period_end: date
    period_type: str  # "annual" | "quarterly"
    price: float | None = None
    market_cap: float | None = None
    pe: float | None = None
    eps: float | None = None
    capex: float | None = None
    ebitda: float | None = None
    revenue: float | None = None
    net_income: float | None = None


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
    # Stored financial periods (watchlist + critical only); empty until market-data ingest runs.
    financials: list[FinancialOut] = Field(default_factory=list)


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
    suggest_deeper: bool = False
    deeper_topic: str | None = None


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


class ProgressOut(BaseModel):
    """Live heartbeat of a running session — wire mirror of the ``StateProgress`` JSONB payload."""

    phase: str | None = None
    iteration: int = 0
    max_iters: int = 0
    tool_calls: int = 0
    sources: int = 0
    tokens_spent: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    updated_at: datetime | None = None


class TokenUsageOut(BaseModel):
    """Raw token spend of a task, split by component — wire mirror of the ``TokenUsage`` payload.
    ``input``/``output`` are the headline measurements; cache + web_tool_uses give the full picture."""

    input: int = 0
    output: int = 0
    cache_write: int = 0
    cache_read: int = 0
    web_tool_uses: dict[str, int] = Field(default_factory=dict)


class ResearchSessionOut(BaseModel):
    state_id: int
    topic: str
    status: Literal["open", "closed"]
    # Who opened it: "user" (requested from the interface) or "schedule" (the agent's autonomous work).
    initiated_by: str
    current_task: str | None
    # Live progress while running (null when idle / closed).
    progress: ProgressOut | None = None
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
    # Where a failure started: "external" (provider/dependency) vs "internal" (our bug); null on success.
    error_kind: str | None = None
    tokens_used: int | None
    # Raw input/output/cache + web-tool breakdown behind tokens_used (research tasks); null otherwise.
    token_usage: TokenUsageOut | None = None
    state_id: int | None
    # For research tasks: "user" or "schedule" (who initiated it); None for tasks with no initiator
    # (ingest, scoring, digests — always the agent's own scheduled work).
    initiated_by: str | None = None
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


# --- Ops (on-demand workflow triggers) ------------------------------------------
# Let the user kick breadth/research *now* without waiting for the scheduler. Each run goes through
# the normal ``run_task`` path, so it shows up in ``/agent/activity`` as a running task to poll.


class OpsRunResponse(BaseModel):
    workflow: str
    # The run was spawned in the background; poll /agent/activity for the task row.
    started: Literal[True] = True


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
    # Live escalation hint on a fresh assistant reply (not persisted): the agent judged the question
    # worth a bounded deep-research session. The UI offers one-click "dig deeper"; nothing auto-opens.
    suggest_deeper: bool = False
    deeper_topic: str | None = None


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1)
    company_id: int | None = None
    industry_id: int | None = None


# --- Brief latest ----------------------------------------------------------------


class BriefLatestOut(BaseModel):
    title: str | None
    body: str | None
    sent_at: datetime
