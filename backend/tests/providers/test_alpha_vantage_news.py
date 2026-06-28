"""Hermetic tests for the Alpha Vantage NEWS_SENTIMENT wrapper — no network.

Covers the pure ``_map`` (timestamp parse, relevance = max topic/ticker score, topic→domain hint,
ticker extraction, summary passthrough) and the throttle path (a rate-limit response carries no
``feed`` key and must degrade to an empty batch, not raise).
"""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from app.providers import alpha_vantage_news as av

_FEED_ITEM = {
    "title": "Fed holds rates steady",
    "url": "https://example.com/fed",
    "time_published": "20260611T143000",
    "source": "Reuters",
    "summary": "The Federal Reserve left rates unchanged.",
    "topics": [
        {"topic": "economy_monetary", "relevance_score": "0.9"},
        {"topic": "financial_markets", "relevance_score": "0.5"},
    ],
    "overall_sentiment_label": "Neutral",
    "ticker_sentiment": [
        {"ticker": "SPY", "relevance_score": "0.3", "ticker_sentiment_label": "Neutral"},
    ],
}


def test_map_extracts_structure() -> None:
    item = av._map(_FEED_ITEM)
    assert item.url == "https://example.com/fed"
    assert item.headline == "Fed holds rates steady"
    assert item.published_at == datetime(2026, 6, 11, 14, 30, tzinfo=timezone.utc)
    assert item.source == "Reuters"
    assert item.tickers == ["SPY"]
    assert item.summary == "The Federal Reserve left rates unchanged."
    assert item.relevance == 0.9  # max(topic 0.9 / 0.5, ticker 0.3)
    assert item.domain_hint == "macro"  # economy_monetary is the top-relevance mapped topic


def test_map_handles_missing_fields() -> None:
    item = av._map({"title": "Bare", "url": "https://x"})
    assert item.tickers == [] and item.topics == []
    assert item.domain_hint is None and item.relevance is None
    assert isinstance(item.published_at, datetime)  # falls back to now()


class _FakeResp:
    def __init__(self, payload: dict) -> None:
        self._payload = payload

    def raise_for_status(self) -> None:
        pass

    def json(self) -> dict:
        return self._payload


class _FakeClient:
    def __init__(self, payload: dict) -> None:
        self._payload = payload

    async def __aenter__(self) -> "_FakeClient":
        return self

    async def __aexit__(self, *exc: object) -> bool:
        return False

    async def get(self, url: str, params: dict) -> _FakeResp:
        return _FakeResp(self._payload)


@pytest.mark.asyncio
async def test_query_maps_feed(monkeypatch) -> None:
    import httpx

    monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: _FakeClient({"feed": [_FEED_ITEM]}))
    items = await av.AlphaVantageNewsProvider()._query({"function": "NEWS_SENTIMENT"})
    assert [i.url for i in items] == ["https://example.com/fed"]


@pytest.mark.asyncio
async def test_query_throttle_response_returns_empty(monkeypatch) -> None:
    import httpx

    throttle = {"Information": "We have detected your API key... 25 requests per day."}
    monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: _FakeClient(throttle))
    items = await av.AlphaVantageNewsProvider()._query({"function": "NEWS_SENTIMENT"})
    assert items == []
