"""News provider wrapper (Alpha Vantage NEWS_SENTIMENT) — the single news source.

The one file a news-provider swap touches. Alpha Vantage's ``NEWS_SENTIMENT`` endpoint returns a
curated, pre-scored financial-news feed: each article ships ``topics`` (with relevance), a per-ticker
``ticker_sentiment`` (with relevance + a bullish/bearish label), a source ``summary``, and a precise
timestamp. We use the structure directly — relevance both filters and orders the feed, topics give
the surveillance domain — so no LLM re-judges importance downstream.

Pure fetch + map: it never summarizes (the researcher writes the canonical summary), classifies, or
stores. The raw article body never enters the system; AV's extractive ``summary`` rides along as
*input* to the summarizer, not as the stored record.

Free tier is ≈ 25 requests/day, so the ingest spends one call per sweep (breadth by topic; watchlist
depth comes from each article's ``ticker_sentiment``). A throttle/limit response carries no ``feed``
key — it is detected and returned as an empty batch so a capped day degrades to "no new items".
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.config import (
    ALPHAVANTAGE_NEWS_LIMIT,
    ALPHAVANTAGE_NEWS_TOPICS,
    ALPHAVANTAGE_TOPIC_DOMAIN,
    get_settings,
)

_BASE_URL = "https://www.alphavantage.co/query"
# Alpha Vantage timestamps: YYYYMMDDTHHMMSS, UTC. The request side uses the minute-precision form.
_TS_FORMAT = "%Y%m%dT%H%M%S"
_REQ_TS_FORMAT = "%Y%m%dT%H%M"


@dataclass
class RawNewsItem:
    """A provider event before any AI processing. Maps onto ``news_ingest.RawEvent``.

    Beyond the basics, Alpha Vantage gives structure the pipeline uses without an LLM: ``relevance``
    (the article's max topic/ticker relevance — both the ingest filter and the stored significance),
    ``topics`` (raw AV topic ids), ``domain_hint`` (those topics mapped to a surveillance domain), and
    ``summary`` (AV's extractive summary, fed to the summarizer as input)."""

    url: str
    headline: str
    published_at: datetime
    source: str | None = None
    tickers: list[str] = field(default_factory=list)
    summary: str | None = None
    topics: list[str] = field(default_factory=list)
    domain_hint: str | None = None
    relevance: float | None = None


class AlphaVantageNewsProvider:
    """Stable surface over Alpha Vantage NEWS_SENTIMENT (breadth by topic, depth by ticker)."""

    def __init__(self) -> None:
        self._api_key = get_settings().alphavantage_api_key

    async def fetch_breadth(self, *, since: datetime | None = None) -> list[RawNewsItem]:
        """The breadth sweep: latest news across the configured topics in one request.

        Topics are OR-joined, so a single call spans macro / industry / market. Each article keeps
        its ``ticker_sentiment``, so watchlisted names resolve downstream with no second call."""
        params = {
            "function": "NEWS_SENTIMENT",
            "topics": ",".join(ALPHAVANTAGE_NEWS_TOPICS),
            "sort": "LATEST",
            "limit": str(ALPHAVANTAGE_NEWS_LIMIT),
        }
        if since is not None:
            params["time_from"] = since.astimezone(timezone.utc).strftime(_REQ_TS_FORMAT)
        return await self._query(params)

    async def fetch_for_tickers(
        self, symbols: list[str], *, since: datetime | None = None
    ) -> list[RawNewsItem]:
        """Optional depth: news filtered to specific tickers (one request, comma-joined symbols).

        Off by default in ingest (``ALPHAVANTAGE_FETCH_TICKER_DEPTH``) to respect the free-tier
        budget; meant for a paid key where the extra daily call is affordable."""
        if not symbols:
            return []
        params = {
            "function": "NEWS_SENTIMENT",
            "tickers": ",".join(symbols),
            "sort": "LATEST",
            "limit": str(ALPHAVANTAGE_NEWS_LIMIT),
        }
        if since is not None:
            params["time_from"] = since.astimezone(timezone.utc).strftime(_REQ_TS_FORMAT)
        return await self._query(params)

    async def _query(self, params: dict[str, str]) -> list[RawNewsItem]:
        """One NEWS_SENTIMENT request → mapped items. Network/transport lives entirely here.

        A rate-limit / informational response has no ``feed`` key (Alpha Vantage returns
        ``Information`` or ``Note`` instead); we treat that as an empty batch so a throttled sweep
        writes nothing rather than raising."""
        import httpx

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(_BASE_URL, params={**params, "apikey": self._api_key})
            resp.raise_for_status()
            payload = resp.json()

        feed = payload.get("feed")
        if not isinstance(feed, list):
            return []
        items: list[RawNewsItem] = []
        for row in feed:
            item = _map(row)
            if item.url and item.headline:
                items.append(item)
        return items


def _parse_time(raw: str | None) -> datetime:
    if raw:
        try:
            return datetime.strptime(raw, _TS_FORMAT).replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    return datetime.now(timezone.utc)


def _as_float(value: object) -> float | None:
    try:
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None


def _map(row: dict) -> RawNewsItem:
    """Map one Alpha Vantage ``feed`` entry to a ``RawNewsItem``.

    ``relevance`` is the article's strongest topic/ticker relevance — a single 0..1 signal for both
    the ingest filter and the stored significance. ``domain_hint`` is the highest-relevance topic
    mapped through ``ALPHAVANTAGE_TOPIC_DOMAIN`` (geopolitics is intentionally never produced here —
    AV has no such topic, so those items fall to the keyword router)."""
    topic_entries = row.get("topics") or []
    topics: list[str] = []
    best_topic_rel = 0.0
    best_domain: str | None = None
    for t in topic_entries:
        name = t.get("topic")
        if not name:
            continue
        topics.append(name)
        rel = _as_float(t.get("relevance_score")) or 0.0
        domain = ALPHAVANTAGE_TOPIC_DOMAIN.get(name)
        if domain is not None and rel >= best_topic_rel:
            best_topic_rel = rel
            best_domain = domain

    tickers: list[str] = []
    best_ticker_rel = 0.0
    for ts in row.get("ticker_sentiment") or []:
        sym = ts.get("ticker")
        if not sym:
            continue
        tickers.append(sym)
        best_ticker_rel = max(best_ticker_rel, _as_float(ts.get("relevance_score")) or 0.0)

    relevance = max(best_topic_rel, best_ticker_rel)
    return RawNewsItem(
        url=row.get("url", ""),
        headline=row.get("title", ""),
        published_at=_parse_time(row.get("time_published")),
        source=row.get("source"),
        tickers=tickers,
        summary=row.get("summary") or None,
        topics=topics,
        domain_hint=best_domain,
        relevance=relevance or None,
    )


def get_news_provider() -> AlphaVantageNewsProvider:
    return AlphaVantageNewsProvider()
