"""Hermetic tests for the RSS/Atom web-news provider — real feedparser, no network.

``_parse_feed`` is fed canned RSS bytes; ``fetch`` is exercised with a stubbed httpx client so the
since-filter and per-feed resilience are covered without hitting the wire."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from app.providers import web_news
from app.providers.news import RawNewsItem

_RSS = b"""<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Test Wire</title>
  <item>
    <title>Fed holds rates steady</title>
    <link>https://example.com/fed</link>
    <pubDate>Wed, 18 Jun 2025 12:00:00 GMT</pubDate>
  </item>
  <item>
    <title>Old macro note</title>
    <link>https://example.com/old</link>
    <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
  </item>
</channel></rss>"""


def test_parse_feed_maps_entries() -> None:
    items = web_news._parse_feed(_RSS)
    assert [i.url for i in items] == ["https://example.com/fed", "https://example.com/old"]
    fed = items[0]
    assert isinstance(fed, RawNewsItem)
    assert fed.headline == "Fed holds rates steady"
    assert fed.source == "Test Wire"
    assert fed.tickers == []
    assert fed.published_at == datetime(2025, 6, 18, 12, 0, tzinfo=timezone.utc)


def test_parse_feed_respects_per_feed_cap(monkeypatch) -> None:
    monkeypatch.setattr(web_news, "WEB_NEWS_MAX_PER_FEED", 1)
    items = web_news._parse_feed(_RSS)
    assert len(items) == 1


class _FakeResp:
    def __init__(self, content: bytes, *, ok: bool = True) -> None:
        self.content = content
        self._ok = ok

    def raise_for_status(self) -> None:
        if not self._ok:
            raise RuntimeError("boom")


class _FakeClient:
    def __init__(self, by_url: dict[str, _FakeResp]) -> None:
        self._by_url = by_url

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def get(self, url: str):
        return self._by_url[url]


@pytest.mark.asyncio
async def test_fetch_filters_since_and_skips_bad_feeds(monkeypatch) -> None:
    monkeypatch.setattr(web_news, "WEB_NEWS_FEEDS", ("good", "bad"))
    responses = {"good": _FakeResp(_RSS), "bad": _FakeResp(b"", ok=False)}

    import httpx

    monkeypatch.setattr(httpx, "AsyncClient", lambda **kw: _FakeClient(responses))

    provider = web_news.WebNewsProvider()
    since = datetime(2025, 1, 1, tzinfo=timezone.utc)
    items = await provider.fetch(since=since)

    # The bad feed is skipped; only the recent item from the good feed survives the since filter.
    urls = [i.url for i in items]
    assert urls == ["https://example.com/fed"]
