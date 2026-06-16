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

    # --- Resilience: timeouts, retries, rate limiting -------------------------
    # Voyage free tier is 3 requests/min. A single process-wide limiter paces *every* embed call
    # (boot indexers, agent recall, close-embedding) to this ceiling so they can't collectively
    # blow the quota. Raising it is safe once a paid Voyage plan lifts the wall.
    voyage_max_rpm: int = 3
    # Per-embed-call timeout (seconds) and bounded retry attempts on transient Voyage failures.
    embed_timeout_s: float = 30.0
    embed_retry_attempts: int = 3
    # Anthropic request timeout (seconds) and SDK-level retry count on transient failures, so a
    # hung model call can't stall a research session indefinitely. Generous on purpose: one
    # deep-research turn runs server-side web_search/web_fetch and legitimately takes minutes —
    # a tight cap (we briefly shipped 120s) kills real work mid-flight. 600s matches the SDK
    # default and still bounds a genuinely hung call; pause_turn checkpoints keep turns shorter.
    llm_timeout_s: float = 600.0
    llm_max_retries: int = 2
    # An open research session whose heartbeat (last_active_at) is older than this is treated as
    # *stalled* in the UI — a genuine "something broke" signal now that the agent beats every turn.
    research_stalled_after_s: int = 240

    # Breadth automation: start the in-process scheduler in the API lifespan. Off by default so
    # dev/tests never fire external-API jobs; the always-on host sets ENABLE_SCHEDULER=true.
    enable_scheduler: bool = False

    # At most this many research sessions may be open at once (the architecture's ≤3 rule);
    # opening one past the cap blocks and surfaces instead of starting a 4th.
    deep_research_max_active: int = 3

    # Origins allowed to call the API cross-origin. Only the Vite dev server needs this —
    # the built SPA is served same-origin behind nginx/Caddy.
    cors_origins: list[str] = ["http://localhost:5173"]


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


# --- Semantic dedup + routing (news ingest) -----------------------------------
# Near-duplicate gate: the same story from many outlets becomes one event. After the summary is
# embedded, cosine top-1 over recent events; at/above this similarity the row is a duplicate and is
# dropped (counted, not written). High floor on purpose — distinct events must not be merged.
DEDUP_SIMILARITY_THRESHOLD = 0.92
# Only compare against events from the last N days — the same story doesn't recur weeks apart, and
# the window bounds the cosine scan.
DEDUP_LOOKBACK_DAYS = 3

# Orphan-routing gate: a macro/general item with no company match is routed to its closest industry
# by cosine over the industry embeddings. Below this similarity it stays unrouted (industry_id=None)
# rather than forced into a poor fit.
ROUTE_SIMILARITY_THRESHOLD = 0.45


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


# --- First-boot defaults (bootstrap) -------------------------------------------
# ``app.db.bootstrap.ensure_defaults`` seeds these idempotently at API startup — default
# *state*, not sample data: a general/popular coverage universe the breadth pipelines keep
# fresh. Everything here is user-editable afterwards (Settings, Industries, watchlist).

# Modest default cap so an unattended deployment can't spend unbounded; raise it in Settings.
DEFAULT_WEEKLY_TOKEN_BUDGET = 2_000_000

DEFAULT_INTERESTED_SECTORS: list[str] = [
    "Information Technology",
    "Communication Services",
    "Financials",
    "Energy",
    "Health Care",
]

# Default brief mega-caps (ARCHITECTURE: 5-7 user stocks under the fixed core).
DEFAULT_BRIEF_USER: list[str] = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN"]

# The general industries vocabulary — the popular domains macro news keeps touching.
DEFAULT_INDUSTRIES: list[dict[str, str]] = [
    {"key": "semiconductors", "name": "Semiconductors", "description": "Chip design, fabrication, and equipment across the supply chain."},
    {"key": "ai-cloud-software", "name": "AI & Cloud Software", "description": "AI platforms, hyperscale cloud, and enterprise software."},
    {"key": "consumer-tech", "name": "Consumer Technology", "description": "Consumer electronics, devices, and platform ecosystems."},
    {"key": "ev-auto", "name": "EV & Automotive", "description": "Electric vehicles, legacy autos, and the battery chain."},
    {"key": "energy-oil-gas", "name": "Energy (Oil & Gas)", "description": "Majors, shale, and global oil/gas supply dynamics."},
    {"key": "banks-financials", "name": "Banks & Financials", "description": "Banks, payments, insurance, and capital markets."},
    {"key": "pharma-biotech", "name": "Pharma & Biotech", "description": "Pharmaceuticals, biotech, and drug-approval pipelines."},
    {"key": "defense-aerospace", "name": "Defense & Aerospace", "description": "Defense primes, aerospace, and government programs."},
    {"key": "consumer-retail", "name": "Consumer & Retail", "description": "Retail, e-commerce, and consumer spending signals."},
    {"key": "industrials", "name": "Industrials & Manufacturing", "description": "Machinery, logistics, construction, and reshoring."},
    {"key": "telecom-media", "name": "Telecom & Media", "description": "Carriers, streaming, advertising, and social platforms."},
]

# Popular mega-caps as the starting research surface — ``discovered`` tier (lightweight
# tracking only; the deliberate cost boundary keeps deep scoring on the watchlist).
DEFAULT_COMPANIES: list[dict[str, str]] = [
    {"ticker": "AAPL", "name": "Apple Inc.", "sector": "Information Technology", "industry": "consumer-tech", "exchange": "NASDAQ"},
    {"ticker": "MSFT", "name": "Microsoft Corporation", "sector": "Information Technology", "industry": "ai-cloud-software", "exchange": "NASDAQ"},
    {"ticker": "NVDA", "name": "NVIDIA Corporation", "sector": "Information Technology", "industry": "semiconductors", "exchange": "NASDAQ"},
    {"ticker": "GOOGL", "name": "Alphabet Inc.", "sector": "Communication Services", "industry": "ai-cloud-software", "exchange": "NASDAQ"},
    {"ticker": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Discretionary", "industry": "consumer-retail", "exchange": "NASDAQ"},
    {"ticker": "META", "name": "Meta Platforms Inc.", "sector": "Communication Services", "industry": "telecom-media", "exchange": "NASDAQ"},
    {"ticker": "TSLA", "name": "Tesla Inc.", "sector": "Consumer Discretionary", "industry": "ev-auto", "exchange": "NASDAQ"},
    {"ticker": "AVGO", "name": "Broadcom Inc.", "sector": "Information Technology", "industry": "semiconductors", "exchange": "NASDAQ"},
    {"ticker": "TSM", "name": "Taiwan Semiconductor (ADR)", "sector": "Information Technology", "industry": "semiconductors", "exchange": "NYSE"},
    {"ticker": "JPM", "name": "JPMorgan Chase & Co.", "sector": "Financials", "industry": "banks-financials", "exchange": "NYSE"},
    {"ticker": "XOM", "name": "Exxon Mobil Corporation", "sector": "Energy", "industry": "energy-oil-gas", "exchange": "NYSE"},
    {"ticker": "LLY", "name": "Eli Lilly and Company", "sector": "Health Care", "industry": "pharma-biotech", "exchange": "NYSE"},
    {"ticker": "LMT", "name": "Lockheed Martin Corporation", "sector": "Industrials", "industry": "defense-aerospace", "exchange": "NYSE"},
    {"ticker": "CAT", "name": "Caterpillar Inc.", "sector": "Industrials", "industry": "industrials", "exchange": "NYSE"},
]
