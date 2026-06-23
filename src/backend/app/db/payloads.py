"""Pydantic models for every JSONB column in the schema.

Per the repo structure: JSONB is used only where a payload's shape legitimately varies,
and each such column is still typed and validated at the DB boundary via the
``PydanticJSONB`` TypeDecorator (in ``base.py``). These models are the *persistence* shape
of those payloads — kept separate from API/response schemas (which live in ``api/``).
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, RootModel

# --- Coverage / preferences ---------------------------------------------------


class Thresholds(BaseModel):
    """Alert thresholds — used both per-watchlist-company and as user defaults.

    Named fields cover the common cases; ``extra='allow'`` leaves room for rubric- or
    user-specific thresholds without a migration.
    """

    model_config = ConfigDict(extra="allow")

    price_move_pct: float | None = None
    volume_x: float | None = None
    score_shift: float | None = None


class UserChannels(BaseModel):
    """Notification routing + addresses, and which channels each delivery shape uses."""

    email: str | None = None
    imessage: str | None = None
    whatsapp: str | None = None
    digest_channels: list[str] = Field(default_factory=lambda: ["email", "in_app"])
    brief_channels: list[str] = Field(default_factory=lambda: ["imessage", "in_app"])


class QuietHours(BaseModel):
    start_hour_utc: int | None = None
    end_hour_utc: int | None = None


# --- Market data --------------------------------------------------------------


class CalendarPayload(BaseModel):
    """Event-type-specific calendar details (shape varies by earnings/dividend/...)."""

    model_config = ConfigDict(extra="allow")

    amount: float | None = None
    estimate_eps: float | None = None
    note: str | None = None


# --- Analysis -----------------------------------------------------------------


class ScorePayload(RootModel[dict[str, float]]):
    """Rubric-specific sub-scores as a flat dimension→value map. The concrete dimensions
    live in versioned prompts (carried by ``rubric_version`` on the row), so the schema
    stays stable as rubrics evolve."""


class AnalysisContent(BaseModel):
    """Content of a broader analysis row (sector, industry, macro, supply-chain, or stock
    summary). Shape is intentionally open — the ``type`` column on ``analysis`` is the
    discriminator; prompts define the actual keys."""

    model_config = ConfigDict(extra="allow")


class AnalysisSupportingInputs(BaseModel):
    """Source provenance for an analysis row — replaces the old citations table."""

    news_event_ids: list[int] = Field(default_factory=list)
    source_refs: list[str] = Field(default_factory=list)


class SectionSummaryPayload(BaseModel):
    """The structured part of a section synthesis: the key tickers the section flags and the
    news events the snapshot was built from (provenance)."""

    key_tickers: list[str] = Field(default_factory=list)
    source_event_ids: list[int] = Field(default_factory=list)


# --- Chat -----------------------------------------------------------------------


class ChatSources(BaseModel):
    """Provenance for an assistant chat message — the events and URLs the answer drew on."""

    news_event_ids: list[int] = Field(default_factory=list)
    urls: list[str] = Field(default_factory=list)


# --- Research state -----------------------------------------------------------


class StateSources(BaseModel):
    """Sources consulted during a research session."""

    source_ids: list[int] = Field(default_factory=list)
    urls: list[str] = Field(default_factory=list)


class StateTask(BaseModel):
    """Summary of one task the agent completed or abandoned within a session."""

    model_config = ConfigDict(extra="allow")

    type: str
    status: str
    summary: str | None = None


class StateTaskList(RootModel[list[StateTask]]):
    """Ordered list of tasks (previous/finished) stored on the state row."""


class StateProgress(BaseModel):
    """Live heartbeat of a running session — written by the agent loop every iteration so the UI
    can show what it's doing instead of a frozen row. Ephemeral working state, not a record:
    overwritten each turn and meaningless once the session closes."""

    phase: str | None = None  # "gathering" | "synthesizing" | "grounding"
    iteration: int = 0
    max_iters: int = 0
    tool_calls: int = 0  # cumulative client + server tool uses this session
    sources: int = 0  # distinct sources cited so far
    tokens_spent: int = 0  # effective (cost-weighted) tokens spent so far
    input_tokens: int = 0  # raw input tokens so far (incl. cached input)
    output_tokens: int = 0  # raw output tokens so far
    updated_at: datetime | None = None


class TokenUsage(BaseModel):
    """The token spend of a research session, broken out by component. ``input``/``output`` are the
    raw counts the user reads (each on its own scale); ``cache_write``/``cache_read`` are the
    prompt-cache portions of input that the blended ``tasks.tokens_used`` cost figure weights at
    1.25x/0.1x. ``web_tool_uses`` counts the server-side web_search/web_fetch calls, which bill
    per-use on the Anthropic account *outside* the token figures — the otherwise-invisible cost."""

    input: int = 0
    output: int = 0
    cache_write: int = 0
    cache_read: int = 0
    web_tool_uses: dict[str, int] = Field(default_factory=dict)


# --- Tasks --------------------------------------------------------------------


class TaskParams(BaseModel):
    """Task-type-specific inputs. Queryable fields are columns on ``tasks``; variable
    inputs live here."""

    model_config = ConfigDict(extra="allow")


class TaskResult(BaseModel):
    """Task-type-specific outputs / summary counts."""

    model_config = ConfigDict(extra="allow")

    counts: dict[str, int] = Field(default_factory=dict)
    message: str | None = None


# --- Brief --------------------------------------------------------------------
# NOTE: BriefInstrument is no longer a JSONB persistence payload — the brief_runs table was
# removed (the brief is regenerated live from quotes, never stored). It survives only as the
# result shape of the get_brief_state tool + API wire schema. Relocate it to
# tools/tool_schema.py when the tools layer is reworked; kept here for now so the (deferred)
# tools layer stays importable without changes.


class BriefInstrument(BaseModel):
    symbol: str
    label: str | None = None
    price: float | None = None
    change: float | None = None
    change_pct: float | None = None
