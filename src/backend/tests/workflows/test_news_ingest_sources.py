"""Hermetic test: ``_fetch_events`` pulls Alpha Vantage breadth and maps its structure onto RawEvent.

No Postgres, no network — the session, screen, and the provider are stubbed. Confirms the breadth
call flows, that a watchlisted ticker named in an article resolves to its company, and that AV's
``domain_hint``/``relevance``/``summary`` ride onto the event. The optional ticker-depth call stays
off (``ALPHAVANTAGE_FETCH_TICKER_DEPTH`` defaults False).
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

from app.providers.alpha_vantage_news import RawNewsItem
from app.workflows.research import news_ingest

_NOW = datetime.now(timezone.utc)


class _AVStub:
    async def fetch_breadth(self, *, since=None):
        return [
            RawNewsItem(
                url="https://av/macro", headline="Fed signals on rates", published_at=_NOW,
                source="AV", tickers=[], summary="macro summary",
                topics=["economy_monetary"], domain_hint="macro", relevance=0.6,
            ),
            RawNewsItem(
                url="https://av/nvda", headline="NVDA ships chips", published_at=_NOW,
                source="AV", tickers=["NVDA"], summary="company summary",
                topics=["technology"], domain_hint="industry", relevance=0.8,
            ),
        ]

    async def fetch_for_tickers(self, symbols, *, since=None):  # off by default; must not be called
        raise AssertionError("ticker-depth call should be gated off")


@pytest.mark.asyncio
async def test_fetch_events_maps_alpha_vantage_breadth(monkeypatch) -> None:
    @asynccontextmanager
    async def _ro():
        yield object()

    async def _screen(session, *, filters):
        # One tracked company so the NVDA article resolves to a company + industry home.
        return [SimpleNamespace(
            ticker="NVDA", company_id=5, industry_id=3, coverage_tier=news_ingest.CoverageTier.watchlist
        )]

    monkeypatch.setattr(news_ingest, "readonly_session", _ro)
    monkeypatch.setattr(news_ingest, "screen_stocks", _screen)
    monkeypatch.setattr(news_ingest, "get_news_provider", lambda: _AVStub())

    events = {e.url: e for e in await news_ingest._fetch_events()}
    assert set(events) == {"https://av/macro", "https://av/nvda"}

    macro = events["https://av/macro"]
    assert macro.domain_hint == "macro" and macro.relevance == 0.6 and macro.company_id is None
    assert macro.summary == "macro summary"

    nvda = events["https://av/nvda"]
    assert nvda.company_id == 5 and nvda.industry_id == 3  # resolved from ticker_sentiment
    assert nvda.domain_hint == "industry" and nvda.relevance == 0.8
