"""World surveillance feed — the always-on middle view, composed read-only from stored reads.

Assembles the four domains from stored news events (Alpha Vantage *sweeps*), attaches the agent's
per-section synthesis (``section_summary``, written by ``section_synthesis`` — *researched*), and
reuses the latest digest as the cross-domain overview. No LLM runs in the request: everything here
is a read. The two-engine distinction stays honest in the wire shape — swept article items carry
AV's summary, while each domain's ``summary`` is the agent's section snapshot.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session
from app.api.routes.home import latest_digest
from app.api.schemas import WorldDomain, WorldItem, WorldSignal, WorldView
from app.config import (
    PAYWALLED_SOURCE_DOMAINS,
    WORLD_FEED_LIMIT,
    WORLD_GEOPOLITICS_KEYWORDS,
    WORLD_MACRO_KEYWORDS,
    WORLD_MAX_AGE_HOURS,
    WORLD_NOW_MIN_SIGNIFICANCE,
    WORLD_NOW_WINDOW_HOURS,
    WORLD_SIGNALS_LIMIT,
)
from app.db.models.news import NewsEvent
from app.db.models.section import SectionSummary
from app.utils import classify_domain, derive_horizon, is_paywalled

router = APIRouter(tags=["world"])

# Fixed top-down order: where market moves originate, threaded down to the names the user holds.
_DOMAIN_ORDER: list[tuple[str, str]] = [
    ("geopolitics", "Geopolitics & global events"),
    ("macro", "Macroeconomics"),
    ("industry", "Industry trends"),
    ("market", "General market"),
]


@router.get("/world", response_model=WorldView)
async def world(session: AsyncSession = Depends(ro_session)) -> WorldView:
    """The surveillance feed: the agent's overview, the four domains, and the Now/Building signals."""
    now = datetime.now(timezone.utc)
    overview = await latest_digest(session)

    # Relevance is already gated once at ingest (ALPHAVANTAGE_MIN_RELEVANCE); the only display gate is
    # the freshness shelf-life, so a week-old recap can't sit at the top as if it were breaking.
    fresh_after = now - timedelta(hours=WORLD_MAX_AGE_HOURS)
    events = (
        (
            await session.execute(
                select(NewsEvent)
                .where(NewsEvent.published_at >= fresh_after)
                .order_by(NewsEvent.published_at.desc())
                .limit(WORLD_FEED_LIMIT)
            )
        )
        .scalars()
        .all()
    )

    buckets: dict[str, list[WorldItem]] = {key: [] for key, _ in _DOMAIN_ORDER}
    ranked: list[tuple[float, WorldSignal]] = []
    for e in events:
        # Accessibility safety net: never surface a hard-paywalled link. Ingest already drops these
        # before write, so this only catches rows stored before the gate existed (or before the
        # blocklist last changed) — the display-side mirror of the freshness shelf above.
        if is_paywalled(e.url, PAYWALLED_SOURCE_DOMAINS):
            continue
        # Prefer the domain classified + stored at ingest; fall back to the keyword router for
        # rows written before the column existed (or where the classifier abstained).
        domain = (
            e.domain.value
            if e.domain is not None
            else classify_domain(
                f"{e.headline} {e.summary}",
                has_company=e.company_id is not None,
                has_industry=e.industry_id is not None,
                geopolitics_keywords=WORLD_GEOPOLITICS_KEYWORDS,
                macro_keywords=WORLD_MACRO_KEYWORDS,
            )
        )
        horizon = derive_horizon(
            e.significance,
            e.published_at,
            window_hours=WORLD_NOW_WINDOW_HOURS,
            min_significance=WORLD_NOW_MIN_SIGNIFICANCE,
            now=now,
        )
        buckets[domain].append(
            WorldItem(
                title=e.headline,
                detail=e.summary,
                horizon=horizon,
                origin="swept",
                published_at=e.published_at,
                source_url=e.url,
                article_refs=[e.id],
                tickers=list(e.tickers),
                source_country=e.source_country,
            )
        )
        ranked.append(
            (
                e.significance,
                WorldSignal(
                    title=e.headline,
                    horizon=horizon,
                    origin="swept",
                    source_url=e.url,
                    tickers=list(e.tickers),
                ),
            )
        )

    # The agent's per-section synthesis (written by section_synthesis), keyed by domain. Read-only
    # here — no LLM in the request; a domain with no synthesis yet simply shows null.
    sections = (
        (await session.execute(select(SectionSummary).where(SectionSummary.section_key.in_([k for k, _ in _DOMAIN_ORDER]))))
        .scalars()
        .all()
    )
    by_section = {s.section_key: s for s in sections}
    domains = [
        WorldDomain(
            key=key,
            title=title,
            summary=by_section[key].snapshot if key in by_section else None,
            key_tickers=by_section[key].payload.key_tickers if key in by_section else [],
            source_event_ids=by_section[key].payload.source_event_ids if key in by_section else [],
            items=buckets[key],
        )
        for key, title in _DOMAIN_ORDER
    ]
    ranked.sort(key=lambda r: r[0], reverse=True)
    top = [sig for _, sig in ranked[:WORLD_SIGNALS_LIMIT]]
    return WorldView(
        generated_at=now,
        overview=overview,
        domains=domains,
        signals_now=[s for s in top if s.horizon == "now"],
        signals_building=[s for s in top if s.horizon == "building"],
    )
