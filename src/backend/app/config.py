"""Application settings and fixed constants.

Single config layer (pydantic-settings) reading the repo-root `.env` — the same file
docker-compose consumes, so the app and the database agree on credentials.

Per the repo structure, fixed constants live here (not in seed files): the ``pulse_core``
instrument set and the default alert thresholds.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def _find_env_file() -> Path | None:
    """Locate the shared `.env`: an explicit ``ENV_FILE`` path wins, else the nearest
    `.env` walking up from this file (the repo root on the host). Containers typically
    have none — docker-compose injects the same variables as real environment variables.
    """
    override = os.environ.get("ENV_FILE")
    if override:
        return Path(override)
    for parent in Path(__file__).resolve().parents:
        candidate = parent / ".env"
        if candidate.is_file():
            return candidate
    return None


_ENV_FILE = _find_env_file()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Async SQLAlchemy URL (asyncpg driver).
    database_url: str = "postgresql+asyncpg://stockagent:stockagent@localhost:5432/stockagent"

    # Embeddings are FIXED. The model name is stored alongside every vector so a future
    # swap is a detectable, explicit backfill — never silent. The dimension is baked into
    # the pgvector columns at class-definition time, so changing it is a column migration.
    embedding_model: str = "voyage-3"
    embedding_dim: int = 1024
    voyage_api_key: str | None = None

    # LLM (Anthropic). The model NAME is recorded on every analysis row, so a swap is
    # detectable. The agent picks a model per task from the constants below; this key is the
    # single credential the transport wrapper reads.
    anthropic_api_key: str | None = None

    # News provider (Finnhub). Free-tier REST; depth-driven coverage.
    finnhub_api_key: str | None = None

    # Web search (Tavily REST). Single credential for the deep-research web tools.
    web_search_api_key: str | None = None

    # SEC EDGAR is public and keyless but requires a descriptive User-Agent on every request.
    sec_user_agent: str = "ai-stock-agent (contact: set SEC_USER_AGENT)"

    # Notifier. Email via SMTP; the brief pulse goes to iMessage (AppleScript on the host) or
    # WhatsApp. Addresses default to UserPreferences.channels; these are the transport creds.
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None

    # Bound on the agent's per-task tool-use loop — a hard stop on autonomous tool calls.
    agent_max_tool_iters: int = 8

    # Breadth automation: start the in-process scheduler in the API lifespan. Off by default so
    # dev/tests never fire external-API jobs; the always-on host sets ENABLE_SCHEDULER=true.
    enable_scheduler: bool = False

    # At most this many research sessions may be open at once (the architecture's ≤3 rule);
    # opening one past the cap blocks and surfaces instead of starting a 4th.
    deep_research_max_active: int = 3


@lru_cache
def get_settings() -> Settings:
    return Settings()


# --- Model selection (per researcher task) ------------------------------------
# Default to the latest Claude models. Synthesis (prose, snapshots, follow-ups) uses
# Opus/Sonnet for quality; high-volume ingest tasks (summary, significance, pulse) use Haiku
# for cost. The agent's TaskSpec maps each task to one of these.
MODEL_OPUS = "claude-opus-4-8"
MODEL_SONNET = "claude-sonnet-4-6"
MODEL_HAIKU = "claude-haiku-4-5-20251001"

# A deep-research session self-paces over many tool calls, so it gets a larger loop bound than
# the single-shot tasks (which use ``agent_max_tool_iters``). Still bounded — sessions terminate.
DEEP_RESEARCH_MAX_ITERS = 24

# Breadth calls the researcher back: a newly stored (or recheck-promoted) event at/above this
# significance wakes the autonomous deep-research session between scheduled shifts.
DEEP_RESEARCH_WAKEUP_SIGNIFICANCE = 0.7

# An open session older than this is force-completed (flushed findings promoted, then closed) at
# the next autonomous wakeup, so one never-finishing thread can't monopolize resume-first.
DEEP_RESEARCH_MAX_SESSION_AGE_DAYS = 7


# --- Fixed constants ----------------------------------------------------------

# The fixed core of the brief set (user mega-caps are stored on UserPreferences.brief_user).
# Symbols are yFinance-compatible.
BRIEF_CORE: list[dict[str, str]] = [
    {"symbol": "VOO", "label": "S&P 500 (VOO)"},
    {"symbol": "DIA", "label": "Dow Jones (^DJI)"},
    {"symbol": "QQQ", "label": "Nasdaq 100 (QQQ)"},
    {"symbol": "GC=F", "label": "Gold (GC=F)"},
    {"symbol": "^TNX", "label": "US 10Y Treasury Yield"},
    {"symbol": "DX-Y.NYB", "label": "US Dollar Index (DXY)"},
    {"symbol": "^VIX", "label": "Volatility Index (VIX)"},
]

# Default alert thresholds applied to watchlist companies unless overridden.
DEFAULT_THRESHOLDS: dict[str, float] = {
    "price_move_pct": 5.0,
    "volume_x": 2.0,
    "score_shift": 10.0,
}
