"""Pure helper functions shared across the app layer — no classes, no I/O, no DB.

Kept side-effect-free so they're trivially unit-testable and safe to call from any layer.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal

# The surveillance vocabulary. Significance is presented as a time HORIZON, never a number
# (PROJECT.md §8) — the four domains order the world top-down by where market moves originate.
Horizon = Literal["now", "building"]
WorldDomainKey = Literal["geopolitics", "macro", "industry", "market"]


def derive_horizon(
    significance: float,
    published_at: datetime | None,
    *,
    window_hours: float,
    min_significance: float,
    now: datetime | None = None,
) -> Horizon:
    """Map an item to a display horizon. **Now** = act on the tape today (recent *and* material);
    **Building** = expected to matter ahead. The raw ``significance`` only orders items within a
    horizon — the platform never shows the number. Undated items are treated as Building."""
    if published_at is None:
        return "building"
    now = now or datetime.now(timezone.utc)
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    recent = (now - published_at) <= timedelta(hours=window_hours)
    return "now" if recent and significance >= min_significance else "building"


def matches_keywords(text: str, keywords: tuple[str, ...]) -> bool:
    """True if any keyword appears in ``text`` (case-insensitive). Lets ingest run the
    geopolitics check ahead of Alpha Vantage's topic hint so an explicitly geopolitical item
    (sanctions, strait, tariff) lands in geopolitics even when AV tagged it ``economy_macro``."""
    t = text.lower()
    return any(k in t for k in keywords)


def classify_domain(
    text: str,
    *,
    has_company: bool,
    has_industry: bool,
    geopolitics_keywords: tuple[str, ...],
    macro_keywords: tuple[str, ...],
) -> WorldDomainKey:
    """Route a stored event into one surveillance domain. Geopolitics and macro win on keyword
    (they are the origin of moves); otherwise a company-named event is *market*, an industry-tagged
    event is *industry*, and an orphan global event defaults to *geopolitics*. Thin, deterministic,
    and a placeholder for a real ``domain`` classifier — see WORLD_*_KEYWORDS in config."""
    t = text.lower()
    if any(k in t for k in geopolitics_keywords):
        return "geopolitics"
    if any(k in t for k in macro_keywords):
        return "macro"
    if has_company:
        return "market"
    if has_industry:
        return "industry"
    return "geopolitics"
