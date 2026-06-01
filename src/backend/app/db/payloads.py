"""Pydantic models for every JSONB column in the schema.

Per the repo structure: JSONB is used only where a payload's shape legitimately varies,
and each such column is still typed and validated at the DB boundary via the
``PydanticJSONB`` TypeDecorator (in ``base.py``). These models are the *persistence* shape
of those payloads — kept separate from API/response schemas (which live in ``api/``).
"""

from __future__ import annotations

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
    pulse_channels: list[str] = Field(default_factory=lambda: ["imessage", "in_app"])


class QuietHours(BaseModel):
    start_hour_utc: int | None = None
    end_hour_utc: int | None = None


# --- Market data --------------------------------------------------------------


class CalendarPayload(BaseModel):
    """Event-type-specific calendar details (shape varies by earnings/dividend/...)."""

    model_config = ConfigDict(extra="allow")

    amount: float | None = None  # e.g. dividend amount
    estimate_eps: float | None = None
    note: str | None = None


# --- Analysis -----------------------------------------------------------------


class ScoreComponents(RootModel[dict[str, float]]):
    """Rubric-specific sub-scores as a flat name->value map. The concrete dimensions
    live in versioned prompts (carried by ``rubric_version`` on the row), so the schema
    stays stable as rubrics evolve."""


# --- Delivery -----------------------------------------------------------------


class ArticleRef(BaseModel):
    """A reference into ``news_events`` — the digest never duplicates article content."""

    news_event_id: int
    rank: int | None = None


class DigestSection(BaseModel):
    section_title: str
    snapshot: str
    article_refs: list[ArticleRef] = Field(default_factory=list)
    key_tickers: list[str] = Field(default_factory=list)  # 1-5 key stocks to watch


class PulseInstrument(BaseModel):
    symbol: str  # yFinance ticker symbol
    label: str | None = None
    price: float | None = None
    change: float | None = None
    change_pct: float | None = None


# --- Jobs ---------------------------------------------------------------------


class JobParams(BaseModel):
    """Job-type-specific inputs. Queryable fields are columns on ``jobs``; the variable
    inputs live here."""

    model_config = ConfigDict(extra="allow")


class JobResult(BaseModel):
    """Job-type-specific outputs / summary counts."""

    model_config = ConfigDict(extra="allow")

    counts: dict[str, int] = Field(default_factory=dict)
    message: str | None = None
