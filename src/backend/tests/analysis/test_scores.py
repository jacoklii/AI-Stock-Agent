"""Deterministic scoring math — pure, no DB, no LLM."""

from __future__ import annotations

from datetime import date, datetime, timezone

import pytest

from app.analysis import prose_changed, score_fundamental, score_sentiment
from app.db.enums import SignificanceTier
from app.tools.tool_schema import FinancialRow, NewsEventResult


def _fin(**kw) -> FinancialRow:
    base = dict(
        period_end=date(2026, 3, 31),
        period_type="quarterly",
        price=None, market_cap=None, pe=None, eps=None,
        capex=None, ebitda=None, revenue=None, net_income=None,
    )
    base.update(kw)
    return FinancialRow(**base)


def _news(sentiment, tier=SignificanceTier.notable) -> NewsEventResult:
    return NewsEventResult(
        news_event_id=1, company_id=1, industry_id=None, url="http://x",
        source="src", published_at=datetime.now(timezone.utc), headline="h",
        tickers=["AAPL"], sentiment_score=sentiment, significance_tier=tier, summary="s",
    )


def test_fundamental_empty_is_neutral():
    result = score_fundamental([], [])
    assert result.score == 50.0
    assert set(result.components.root) == {"valuation", "growth", "profitability", "leverage"}
    assert result.rubric_version.startswith("fundamental")


def test_fundamental_in_range_and_components():
    rows = [
        _fin(pe=12.0, revenue=120.0, ebitda=40.0, capex=10.0),
        _fin(period_end=date(2025, 3, 31), revenue=80.0),
    ]
    result = score_fundamental(rows, [])
    assert 0.0 <= result.score <= 100.0
    # growing revenue (80 -> 120) should score above neutral on the growth axis
    assert result.components.root["growth"] > 50.0


def test_sentiment_maps_and_weights():
    bullish = score_sentiment([_news(0.8, SignificanceTier.significant)])
    bearish = score_sentiment([_news(-0.8, SignificanceTier.significant)])
    assert bullish.score > 50.0 > bearish.score
    assert score_sentiment([]).score == 50.0  # no scored events -> neutral


def test_prose_changed():
    v = [1.0, 0.0, 0.0]
    assert prose_changed(v, None) is True            # first read is always kept
    assert prose_changed(v, v) is False              # identical -> unchanged
    assert prose_changed([0.0, 1.0, 0.0], v) is True  # orthogonal -> changed
