"""Significance re-check pipeline — promote events that aged into importance.

An event judged routine/notable can prove significant once the subsequent price/volume reaction
is known. This re-evaluates older events still inside their retention window against later price
action and promotes the tier where warranted (which also extends retention).

Skeleton status: pulling candidates, the price/volume re-evaluation, and the tier update are
real; the optional borderline reclassification (agent) is deferred.
"""

from __future__ import annotations

from sqlalchemy import select

from app.config import DEFAULT_THRESHOLDS
from app.db.enums import SignificanceTier
from app.db.models.news import NewsEvent
from app.db.session import SessionLocal, readonly_session
from app.tools.research import get_news_events, get_price_history
from app.workflows.runtime import run_job
from app.workflows.triggers import WF_SIGNIFICANCE_RECHECK

# Promotion ladder.
_NEXT_TIER = {
    SignificanceTier.routine: SignificanceTier.notable,
    SignificanceTier.notable: SignificanceTier.significant,
    SignificanceTier.significant: SignificanceTier.significant,
}


async def _warrants_promotion(event, prices) -> bool:
    """Deterministic rule: a large subsequent price move argues the event mattered. — real"""
    if not prices or len(prices) < 2:
        return False
    closes = [p.close for p in prices if p.close is not None]
    if len(closes) < 2:
        return False
    move_pct = abs(closes[0] - closes[-1]) / closes[-1] * 100.0 if closes[-1] else 0.0
    return move_pct >= DEFAULT_THRESHOLDS["price_move_pct"]


async def _reclassify(event) -> SignificanceTier:
    """Borderline cases the deterministic rule can't settle go to the researcher."""
    raise NotImplementedError("TODO(agent): significance reclassification (borderline)")


async def run(*, lookback_limit: int = 200) -> None:
    async with run_job(WF_SIGNIFICANCE_RECHECK) as job:
        # 1. Candidates: older non-significant events still in retention. — real
        async with readonly_session() as session:
            events = await get_news_events(session, limit=lookback_limit)
            candidates = [e for e in events if e.significance_tier is not SignificanceTier.significant]

            promotions: dict[int, SignificanceTier] = {}
            for event in candidates:
                if event.company_id is None:
                    continue
                prices = await get_price_history(session, company_id=event.company_id, limit=30)
                if await _warrants_promotion(event, prices):  # — real
                    promotions[event.news_event_id] = _NEXT_TIER[event.significance_tier]
        job.count("reviewed", len(candidates))

        # 2. Apply promotions. — real write
        if promotions:
            async with SessionLocal() as session:
                rows = (
                    await session.execute(
                        select(NewsEvent).where(NewsEvent.id.in_(promotions))
                    )
                ).scalars()
                for row in rows:
                    row.significance_tier = promotions[row.id]
                    job.count("promoted")
                await session.commit()
