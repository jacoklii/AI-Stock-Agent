"""GDELT provider wrapper (GDELT DOC 2.0 API) — the geopolitics / global-events source.

The one file a geopolitics-source swap touches. GDELT fills the domain Alpha Vantage structurally
cannot: AV is a financial-only feed with no geopolitics topic. GDELT's DOC 2.0 ``ArtList`` endpoint
is keyless, public, and returns a clean per-article JSON feed (title, url, source domain, language,
source country, seen-date) for an arbitrary query. We sweep one fixed geopolitics query and map each
article into a ``GdeltArticle`` — the ingest then folds these into the *same* pipeline Alpha Vantage
feeds, so the two sources converge on one dedup/relevance/write path.

Pure fetch + map: it never summarizes (GDELT ships no article body or extractive summary, so a GDELT
event's stored summary is its headline — there is nothing to lose), classifies, or stores. The only
courtesy GDELT asks of a keyless caller is a descriptive User-Agent and a gentle call rate; the
ingest spends one request per sweep. A throttle / malformed-query response is not valid JSON (GDELT
returns an HTML/plain error) — it is caught and returned as an empty batch so a capped sweep writes
nothing rather than raising.
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from datetime import datetime, timezone

from app.config import (
    GDELT_MAX_RECORDS,
    GDELT_MIN_INTERVAL_S,
    GDELT_QUERY,
    GDELT_SOURCE_LANG,
    GDELT_TIMESPAN,
    get_settings,
)

_BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc"


class _MinIntervalLimiter:
    """Process-wide min-interval limiter: spaces acquisitions at least ``interval`` seconds apart,
    async-safe via an internal lock. Concurrent callers queue rather than burst — so the steady
    cron and an on-demand user sweep interleave instead of colliding into a GDELT 429. Mirrors the
    embeddings provider's rate limiter."""

    def __init__(self, interval: float) -> None:
        self._interval = interval
        self._lock = asyncio.Lock()
        self._next_at = 0.0

    async def acquire(self) -> None:
        if self._interval <= 0:
            return
        async with self._lock:
            now = time.monotonic()
            wait = self._next_at - now
            if wait > 0:
                await asyncio.sleep(wait)
                now = time.monotonic()
            self._next_at = now + self._interval


# One limiter for the whole process — shared regardless of how many providers are constructed.
_LIMITER = _MinIntervalLimiter(GDELT_MIN_INTERVAL_S)


@dataclass
class GdeltArticle:
    """A GDELT article before any AI processing. Maps onto ``news_ingest.RawEvent``.

    GDELT gives no tickers, topics, or relevance score — its value is the geopolitics/global-events
    coverage AV lacks, plus a ``source_country`` (the country GDELT attributes the article to), which
    is the geographic field stored on the event. ``title`` doubles as the stored summary (there is no
    body)."""

    url: str
    title: str
    published_at: datetime
    source: str | None = None  # GDELT 'domain' (the publishing outlet)
    source_country: str | None = None
    language: str | None = None


class GdeltNewsProvider:
    """Stable surface over GDELT DOC 2.0 (geopolitics breadth by query)."""

    async def fetch_geopolitics(self, *, max_records: int | None = None) -> list[GdeltArticle]:
        """The geopolitics sweep: latest global-events articles matching the configured query.

        One request spans the whole OR-group. ``timespan`` bounds the lookback; ``sourcelang``
        keeps the feed English. Returns newest-first."""
        params = {
            "query": f"{GDELT_QUERY} sourcelang:{GDELT_SOURCE_LANG}",
            "mode": "ArtList",
            "format": "json",
            "maxrecords": str(max_records or GDELT_MAX_RECORDS),
            "sort": "DateDesc",
            "timespan": GDELT_TIMESPAN,
        }
        return await self._query(params)

    async def _query(self, params: dict[str, str]) -> list[GdeltArticle]:
        """One DOC request → mapped articles. Network/transport lives entirely here.

        A malformed query or a throttle yields a non-JSON body; ``resp.json()`` then raises and we
        treat it as an empty batch so a throttled sweep writes nothing rather than failing the run."""
        import httpx

        await _LIMITER.acquire()  # pace every GDELT call to the min interval (never burst → never 429)
        ua = get_settings().sec_user_agent  # reuse the descriptive contact UA (keyless, public APIs)
        try:
            async with httpx.AsyncClient(timeout=20.0, headers={"User-Agent": ua}) as client:
                resp = await client.get(_BASE_URL, params=params)
                resp.raise_for_status()
                payload = resp.json()
        except (httpx.HTTPError, ValueError):
            return []

        feed = payload.get("articles")
        if not isinstance(feed, list):
            return []
        items: list[GdeltArticle] = []
        for row in feed:
            item = _map(row)
            if item.url and item.title:
                items.append(item)
        return items


def _parse_time(raw: str | None) -> datetime:
    """GDELT ``seendate`` is e.g. ``20260624T120000Z`` (UTC). Strip the separators and parse; fall
    back to now on anything unexpected so a single bad timestamp never sinks the batch."""
    if raw:
        digits = "".join(c for c in raw if c.isdigit())
        if len(digits) >= 14:
            try:
                return datetime.strptime(digits[:14], "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
            except ValueError:
                pass
    return datetime.now(timezone.utc)


def _map(row: dict) -> GdeltArticle:
    """Map one GDELT DOC ``articles`` entry to a ``GdeltArticle``."""
    return GdeltArticle(
        url=row.get("url", ""),
        title=row.get("title", ""),
        published_at=_parse_time(row.get("seendate")),
        source=row.get("domain") or None,
        source_country=row.get("sourcecountry") or None,
        language=row.get("language") or None,
    )


def get_gdelt_provider() -> GdeltNewsProvider:
    return GdeltNewsProvider()
