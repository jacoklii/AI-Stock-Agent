"""Deep-research external-read tools: SEC filings and the TTL cache.

These are the agent's cache-first window onto EDGAR. ``fetch_sec_filing`` checks the ``cache``
table first and only hits the network on a miss/expiry, then stores the result — so repeated
reads inside a research session are cheap and the cache stays the single place external content
lives (persistent storage keeps only extracted findings).

General web search/fetch are NOT client tools: they run server-side inside the model's turn
(Anthropic ``web_search``/``web_fetch``), attached per task by the researcher agent.

``cache_get`` is read-only; ``fetch_sec_filing`` / ``cache_set`` write the cache
(``writes=True``) — the one effect these tools have. They never touch production-data tables.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.cache import Cache
from app.providers.sec import SECProvider
from app.tools.registry import TASK_DEEP_RESEARCH, tool
from app.tools.tool_schema import CacheEntry, SecFiling

# Default time-to-live for newly cached content (1 day). Web reads are findings-first; a day
# keeps a research session cheap without serving stale external content across sessions.
_DEFAULT_TTL_SECONDS = 86_400


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:64]


def _entry(row: Cache) -> CacheEntry:
    age = int((datetime.now(timezone.utc) - row.fetched_at).total_seconds())
    return CacheEntry(
        url=row.url,
        content=row.content,
        fetched_at=row.fetched_at,
        age_seconds=age,
        expired=age > row.ttl_seconds,
    )


async def _lookup(session: AsyncSession, url: str) -> CacheEntry | None:
    row = (await session.execute(select(Cache).where(Cache.url == url))).scalar_one_or_none()
    return _entry(row) if row is not None else None


async def _store(session: AsyncSession, url: str, content: str, ttl_seconds: int) -> CacheEntry:
    row = (await session.execute(select(Cache).where(Cache.url == url))).scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if row is None:
        row = Cache(
            url=url,
            content=content,
            ttl_seconds=ttl_seconds,
            content_hash=_hash(content),
            fetched_at=now,
        )
        session.add(row)
    else:
        row.content = content
        row.content_hash = _hash(content)
        row.ttl_seconds = ttl_seconds
        row.fetched_at = now
    await session.commit()
    return _entry(row)


@tool(
    name="fetch_sec_filing",
    description="Most recent SEC filing of a form type for a ticker, with its text (cache-first).",
    tasks={TASK_DEEP_RESEARCH},
    output_model=SecFiling,
    writes=True,
)
async def fetch_sec_filing(
    session: AsyncSession,
    sec_provider: SECProvider,
    *,
    ticker: str,
    form_type: str = "10-K",
) -> SecFiling | None:
    """Discover the latest ``form_type`` filing for ``ticker`` and return its document text.
    Returns ``None`` when no such filing exists. The document text is cached by URL."""
    filings = await sec_provider.recent_filings(ticker, form_type=form_type, limit=1)
    if not filings:
        return None
    filing = filings[0]
    cached = await _lookup(session, filing.url)
    if cached is not None and not cached.expired:
        return SecFiling(form=filing.form, filed_at=filing.filed_at, url=filing.url, content=cached.content, from_cache=True)
    content = await sec_provider.fetch_document(filing.url)
    await _store(session, filing.url, content, _DEFAULT_TTL_SECONDS)
    return SecFiling(form=filing.form, filed_at=filing.filed_at, url=filing.url, content=content, from_cache=False)


@tool(
    name="cache_get",
    description="Cached content for a URL (with age + whether it has expired), or null.",
    tasks={TASK_DEEP_RESEARCH},
    output_model=CacheEntry,
)
async def cache_get(session: AsyncSession, *, url: str) -> CacheEntry | None:
    return await _lookup(session, url)


@tool(
    name="cache_set",
    description="Store content for a URL in the TTL cache (upsert).",
    tasks={TASK_DEEP_RESEARCH},
    output_model=CacheEntry,
    writes=True,
)
async def cache_set(
    session: AsyncSession, *, url: str, content: str, ttl_seconds: int = _DEFAULT_TTL_SECONDS
) -> CacheEntry:
    return await _store(session, url, content, ttl_seconds)
