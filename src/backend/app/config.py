"""Application settings and fixed constants.

Single config layer (pydantic-settings) reading the repo-root `.env` — the same file
docker-compose consumes, so the app and the database agree on credentials.

Per the repo structure, fixed constants live here (not in seed files): the ``pulse_core``
instrument set and the default alert thresholds.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# config.py -> app -> backend -> src -> <repo root>
_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


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


@lru_cache
def get_settings() -> Settings:
    return Settings()


# --- Fixed constants ----------------------------------------------------------

# The fixed core of the market pulse set (user mega-caps are stored on UserPreferences).
# Symbols are yFinance-compatible.
PULSE_CORE: list[dict[str, str]] = [
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
