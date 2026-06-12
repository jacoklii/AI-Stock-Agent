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
