"""Hermetic test: ``_fetch_events`` composes Finnhub + the web-news provider into one batch.

No Postgres, no network — the session, screen, and both providers are stubbed. Confirms the second
breadth source is merged before AI processing (dedup downstream collapses any cross-source overlap).
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone

import pytest

from app.providers.news import RawNewsItem
from app.workflows.research import news_ingest


class _FinnhubStub:
    async def fetch_general_news(self, *, since=None):
        return [RawNewsItem(url="https://finnhub/1", headline="Finnhub macro item", published_at=datetime.now(timezone.utc))]

    async def fetch_events(self, symbols, *, since=None):  # not reached (empty watchlist)
        return []


class _WebStub:
    async def fetch(self, *, since=None):
        return [RawNewsItem(url="https://web/1", headline="Web RSS item", published_at=datetime.now(timezone.utc))]


@pytest.mark.asyncio
async def test_fetch_events_merges_finnhub_and_web(monkeypatch) -> None:
    @asynccontextmanager
    async def _ro():
        yield object()

    async def _screen(session, *, filters):
        return []  # no tracked companies -> general + web only

    monkeypatch.setattr(news_ingest, "readonly_session", _ro)
    monkeypatch.setattr(news_ingest, "screen_stocks", _screen)
    monkeypatch.setattr(news_ingest, "get_news_provider", lambda: _FinnhubStub())
    monkeypatch.setattr(news_ingest, "get_web_news_provider", lambda: _WebStub())

    events = await news_ingest._fetch_events()
    urls = {e.url for e in events}
    assert urls == {"https://finnhub/1", "https://web/1"}
