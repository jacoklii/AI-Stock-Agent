"""Unit tests for the pure app-layer helpers — horizon + domain classification."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.utils import classify_domain, derive_horizon

_GEO = ("war", "sanction", "strait")
_MACRO = ("inflation", "the fed", "yield")
_NOW = datetime(2026, 6, 21, 12, 0, tzinfo=timezone.utc)


def test_horizon_now_requires_recent_and_material() -> None:
    recent = _NOW - timedelta(hours=2)
    assert derive_horizon(0.9, recent, window_hours=48, min_significance=0.6, now=_NOW) == "now"
    # Recent but immaterial → Building.
    assert derive_horizon(0.3, recent, window_hours=48, min_significance=0.6, now=_NOW) == "building"
    # Material but stale → Building.
    old = _NOW - timedelta(days=5)
    assert derive_horizon(0.9, old, window_hours=48, min_significance=0.6, now=_NOW) == "building"
    # Undated → Building.
    assert derive_horizon(0.9, None, window_hours=48, min_significance=0.6, now=_NOW) == "building"


def test_horizon_normalizes_naive_datetimes() -> None:
    naive = (_NOW - timedelta(hours=1)).replace(tzinfo=None)
    assert derive_horizon(0.8, naive, window_hours=48, min_significance=0.6, now=_NOW) == "now"


def test_classify_domain_priority() -> None:
    kw = {"geopolitics_keywords": _GEO, "macro_keywords": _MACRO}
    # Keyword domains win even when a company is attached.
    assert classify_domain("Sanctions on oil", has_company=True, has_industry=False, **kw) == "geopolitics"
    assert classify_domain("Inflation prints hot", has_company=True, has_industry=False, **kw) == "macro"
    # No keyword: company → market, industry → industry, orphan → geopolitics.
    assert classify_domain("Acme beats earnings", has_company=True, has_industry=True, **kw) == "market"
    assert classify_domain("Sector capex rises", has_company=False, has_industry=True, **kw) == "industry"
    assert classify_domain("A global summit convenes", has_company=False, has_industry=False, **kw) == "geopolitics"
