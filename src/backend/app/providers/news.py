"""News provider wrapper (Finnhub).

The single file a news-provider swap would touch. Returns provider-shaped items — metadata
plus the URL and headline. It deliberately does NOT summarize, classify, or store: the raw
article body never enters the system; the researcher agent produces the canonical summary
downstream and the ingest workflow writes the row. This wrapper is pure fetch + map.

Finnhub's REST API is reached over async ``httpx``. The free tier drives depth; the API key
is a single configured credential.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.config import get_settings

_BASE_URL = "https://finnhub.io/api/v1"


@dataclass
class RawNewsItem:
    """A provider event before any AI processing. Maps onto ``news_ingest.RawEvent``."""

    url: str
    headline: str
    published_at: datetime
    source: str | None = None
    tickers: list[str] = field(default_factory=list)


class NewsProvider:
    """Stable surface over Finnhub company/market news."""

    def __init__(self) -> None:
        self._api_key = get_settings().finnhub_api_key

    async def fetch_events(
        self, symbols: list[str], *, since: datetime | None = None
    ) -> list[RawNewsItem]:
        """Pull recent news for each symbol since ``since`` (defaults to provider's window).

        One request per symbol against ``/company-news``; results are flattened and mapped to
        ``RawNewsItem``. Network/transport lives entirely here so callers stay provider-agnostic.
        """
        import httpx

        start = (since or datetime.now(timezone.utc)).date().isoformat()
        end = datetime.now(timezone.utc).date().isoformat()
        items: list[RawNewsItem] = []
        async with httpx.AsyncClient(base_url=_BASE_URL, timeout=20.0) as client:
            for symbol in symbols:
                resp = await client.get(
                    "/company-news",
                    params={"symbol": symbol, "from": start, "to": end, "token": self._api_key},
                )
                resp.raise_for_status()
                for row in resp.json():
                    items.append(_map_item(row, symbol))
        return items

    async def fetch_general_news(self, *, since: datetime | None = None) -> list[RawNewsItem]:
        """The general/macro market feed (Finnhub ``/news?category=general``).

        The endpoint returns only the latest headlines (no date range), so ``since`` filters
        client-side — the hourly run ingests just its new window. Items keep whatever tickers
        the provider relates; many are pure macro with none."""
        import httpx

        async with httpx.AsyncClient(base_url=_BASE_URL, timeout=20.0) as client:
            resp = await client.get(
                "/news", params={"category": "general", "token": self._api_key}
            )
            resp.raise_for_status()
            rows = resp.json()

        items: list[RawNewsItem] = []
        for row in rows:
            item = _map_general(row)
            if not item.url or not item.headline:
                continue
            if since is not None and item.published_at < since:
                continue
            items.append(item)
        return items


def _map_item(row: dict, symbol: str) -> RawNewsItem:
    ts = row.get("datetime")
    published = (
        datetime.fromtimestamp(ts, tz=timezone.utc)
        if ts
        else datetime.now(timezone.utc)
    )
    return RawNewsItem(
        url=row.get("url", ""),
        headline=row.get("headline", ""),
        published_at=published,
        source=row.get("source"),
        tickers=[symbol] + [t for t in row.get("related", "").split(",") if t and t != symbol],
    )


def _map_general(row: dict) -> RawNewsItem:
    ts = row.get("datetime")
    published = (
        datetime.fromtimestamp(ts, tz=timezone.utc)
        if ts
        else datetime.now(timezone.utc)
    )
    return RawNewsItem(
        url=row.get("url", ""),
        headline=row.get("headline", ""),
        published_at=published,
        source=row.get("source"),
        tickers=[t for t in row.get("related", "").split(",") if t],
    )


def get_news_provider() -> NewsProvider:
    return NewsProvider()
