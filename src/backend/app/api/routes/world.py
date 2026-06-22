"""World surveillance feed — the always-on middle view, composed read-only from existing reads.

Architecture-first: this assembles the four domains from stored scraper events and reuses the
latest digest as the agent's overview. It adds no table and runs no workflow — a real per-event
``domain`` classifier and the cross-domain propagation chains are deferred enrichment. Stored news
events are *swept* by the scraper; the overview digest is the agent's synthesis (*researched*), so
the two-engine distinction stays honest in the wire shape.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session
from app.api.routes.home import latest_digest
from app.api.schemas import WorldDomain, WorldItem, WorldSignal, WorldView
from app.config import (
    WORLD_FEED_LIMIT,
    WORLD_GEOPOLITICS_KEYWORDS,
    WORLD_MACRO_KEYWORDS,
    WORLD_NOW_MIN_SIGNIFICANCE,
    WORLD_NOW_WINDOW_HOURS,
    WORLD_SIGNALS_LIMIT,
)
from app.db.models.news import NewsEvent
from app.utils import classify_domain, derive_horizon

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

    events = (
        (
            await session.execute(
                select(NewsEvent).order_by(NewsEvent.published_at.desc()).limit(WORLD_FEED_LIMIT)
            )
        )
        .scalars()
        .all()
    )

    buckets: dict[str, list[WorldItem]] = {key: [] for key, _ in _DOMAIN_ORDER}
    ranked: list[tuple[float, WorldSignal]] = []
    for e in events:
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

    domains = [WorldDomain(key=key, title=title, items=buckets[key]) for key, title in _DOMAIN_ORDER]
    ranked.sort(key=lambda r: r[0], reverse=True)
    top = [sig for _, sig in ranked[:WORLD_SIGNALS_LIMIT]]
    return WorldView(
        generated_at=now,
        overview=overview,
        domains=domains,
        signals_now=[s for s in top if s.horizon == "now"],
        signals_building=[s for s in top if s.horizon == "building"],
    )
