"""GDELT geopolitics ingest — the standing global-events sweep, separate from the AV cadence.

GDELT fills the domain Alpha Vantage structurally cannot (AV is financial-only with no geopolitics
topic). It is keyless with no daily request budget — only a ≤1-request/5s politeness limit, paced
process-wide by the provider's limiter — so it runs on its own flat, round-the-clock schedule
(``gdelt_ingest_steady``) rather than AV's market-hours, free-tier-budgeted cadence. The same flat
pacing leaves the rate budget almost entirely free for on-demand user sweeps: the limiter interleaves
the cron run and a manual ``/ops/sweep`` instead of letting them burst into a 429.

It owns only the *fetch + shape* step; the dedup / relevance / paywall / write rules live once in
``news_ingest.persist_events`` and are reused here, so geopolitics and financial news file identical
rows. Each GDELT article is an orphan (no company / industry), forced into the ``geopolitics`` domain,
filed at the GDELT significance floor, summarized by its headline (GDELT ships no body), and tagged
with its ``source_country`` — the geographic dimension. GDELT events name no company and clear no
wakeup bar, so this path runs no re-score or researcher wakeup.
"""

from __future__ import annotations

from app.config import GDELT_DEFAULT_SIGNIFICANCE
from app.providers.gdelt import get_gdelt_provider
from app.workflows.concurrency import workflow_slot
from app.workflows.research.news_ingest import RawEvent, persist_events
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_GDELT_INGEST


async def _fetch_events() -> list[RawEvent]:
    """Pull the geopolitics / global-events feed from GDELT and shape it into ``RawEvent``s."""
    provider = get_gdelt_provider()
    articles = await provider.fetch_geopolitics()
    return [
        RawEvent(
            url=a.url,
            source=a.source,
            published_at=a.published_at,
            headline=a.title,
            tickers=[],
            company_id=None,
            industry_id=None,
            summary=a.title,
            domain_hint="geopolitics",
            relevance=GDELT_DEFAULT_SIGNIFICANCE,
            source_country=a.source_country,
        )
        for a in articles
    ]


async def run() -> None:
    # One geopolitics sweep at a time: the steady cron and an on-demand user sweep would otherwise
    # race the URL dedup. A skipped run is fine — the holder is doing the same work. (The provider's
    # process-wide limiter additionally paces the actual GDELT call so neither bursts into a 429.)
    async with workflow_slot(WF_GDELT_INGEST) as acquired:
        if not acquired:
            return
        async with run_task(WF_GDELT_INGEST) as task:
            raw = await _fetch_events()
            await persist_events(raw, task)  # touched/wake unused — geopolitics names no company
