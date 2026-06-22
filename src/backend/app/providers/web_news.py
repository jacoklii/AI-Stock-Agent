"""Generic web-news provider (RSS / Atom feeds) — a second breadth source beside Finnhub.

The single file a feed-source change touches. Like ``news.py`` it is pure fetch + map: it returns
provider-shaped ``RawNewsItem``s (the same dataclass), never summarizing, classifying, or storing.
The ingest pipeline's existing URL + semantic dedup means the same story arriving from Finnhub and
a feed collapses to one row, so the two sources compose without special-casing.

Feeds are configured (``WEB_NEWS_FEEDS``); most carry no ticker tags, so these items flow as macro/
general breadth and get an industry home by embedding routing downstream. One bad feed is skipped,
never sinking the batch — the same per-source resilience the quote path uses.
"""

from __future__ import annotations

import calendar
from datetime import datetime, timezone

from app.config import WEB_NEWS_FEEDS, WEB_NEWS_MAX_PER_FEED
from app.providers.news import RawNewsItem


class WebNewsProvider:
    """Stable surface over a set of RSS/Atom feeds."""

    def __init__(self) -> None:
        self._feeds = list(WEB_NEWS_FEEDS)

    async def fetch(self, *, since: datetime | None = None) -> list[RawNewsItem]:
        """Pull recent entries across all configured feeds, newest-window only when ``since`` set.

        Feeds are fetched concurrently over async httpx; each feed's bytes are parsed with
        ``feedparser``. A feed that errors or times out is skipped so the rest still flow."""
        import asyncio

        import httpx

        if not self._feeds:
            return []

        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            async def _one(url: str) -> list[RawNewsItem]:
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    return _parse_feed(resp.content)
                except Exception:
                    return []

            batches = await asyncio.gather(*(_one(u) for u in self._feeds))

        items: list[RawNewsItem] = []
        for batch in batches:
            for item in batch:
                if not item.url or not item.headline:
                    continue
                if since is not None and item.published_at < since:
                    continue
                items.append(item)
        return items


def _parse_feed(content: bytes) -> list[RawNewsItem]:
    """Map one feed's entries to ``RawNewsItem`` (capped per feed). Sync, CPU-light parsing."""
    import feedparser

    parsed = feedparser.parse(content)
    source = (parsed.feed.get("title") if getattr(parsed, "feed", None) else None) or None
    items: list[RawNewsItem] = []
    for entry in parsed.entries[:WEB_NEWS_MAX_PER_FEED]:
        items.append(
            RawNewsItem(
                url=entry.get("link", ""),
                headline=entry.get("title", ""),
                published_at=_entry_time(entry),
                source=source,
                tickers=[],
            )
        )
    return items


def _entry_time(entry: object) -> datetime:
    """Best-effort published time from an entry's ``*_parsed`` struct (feedparser normalizes to UTC)."""
    struct = entry.get("published_parsed") or entry.get("updated_parsed")  # type: ignore[attr-defined]
    if struct is None:
        return datetime.now(timezone.utc)
    return datetime.fromtimestamp(calendar.timegm(struct), tz=timezone.utc)


def get_web_news_provider() -> WebNewsProvider:
    return WebNewsProvider()
