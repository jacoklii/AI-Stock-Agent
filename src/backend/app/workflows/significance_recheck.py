"""Significance re-check pipeline — promote events that aged into importance.

An event judged routine/notable can prove significant once the subsequent price/volume reaction is
known. This re-evaluates older events still inside their retention window against later price
action: a clear move promotes deterministically; a borderline move goes to the researcher to
reclassify. Promotions extend retention.
"""

from __future__ import annotations

from sqlalchemy import select

from app.agents.researcher import get_researcher
from app.config import DEFAULT_THRESHOLDS
from app.db.enums import SignificanceTier
from app.db.models.news import NewsEvent
from app.db.session import SessionLocal, readonly_session
from app.tools.registry import TASK_SIGNIFICANCE
from app.tools.research import get_news_events, get_price_history
from app.workflows.runtime import run_job
from app.workflows.triggers import WF_SIGNIFICANCE_RECHECK

# Promotion ladder + ordering for "is this tier higher than that one".
_NEXT_TIER = {
    SignificanceTier.routine: SignificanceTier.notable,
    SignificanceTier.notable: SignificanceTier.significant,
    SignificanceTier.significant: SignificanceTier.significant,
}
_RANK = {SignificanceTier.routine: 0, SignificanceTier.notable: 1, SignificanceTier.significant: 2}

# Borderline band: a move this fraction of the threshold (but under it) is ambiguous -> ask agent.
_BORDERLINE_FRACTION = 0.7


def _move_pct(prices) -> float | None:
    closes = [p.close for p in prices if p.close is not None]
    if len(closes) < 2 or not closes[-1]:
        return None
    return abs(closes[0] - closes[-1]) / closes[-1] * 100.0


async def _reclassify(event) -> SignificanceTier:
    """Borderline cases the deterministic rule can't settle go to the researcher."""
    out = await get_researcher().run_task(TASK_SIGNIFICANCE, inputs={"event": event})
    return out.tier


async def run(*, lookback_limit: int = 200) -> None:
    threshold = DEFAULT_THRESHOLDS["price_move_pct"]
    async with run_job(WF_SIGNIFICANCE_RECHECK) as job:
        # 1. Candidates: older non-significant events still in retention. — read tools
        promotions: dict[int, SignificanceTier] = {}
        async with readonly_session() as session:
            events = await get_news_events(session, limit=lookback_limit)
            candidates = [e for e in events if e.significance_tier is not SignificanceTier.significant]
            for event in candidates:
                if event.company_id is None:
                    continue
                prices = await get_price_history(session, company_id=event.company_id, limit=30)
                move = _move_pct(prices)
                if move is None:
                    continue
                if move >= threshold:  # clear -> deterministic promotion
                    promotions[event.news_event_id] = _NEXT_TIER[event.significance_tier]
                elif move >= threshold * _BORDERLINE_FRACTION:  # ambiguous -> researcher
                    tier = await _reclassify(event)
                    if _RANK[tier] > _RANK[event.significance_tier]:
                        promotions[event.news_event_id] = tier
        job.count("reviewed", len(candidates))

        # 2. Apply promotions. — write
        if promotions:
            async with SessionLocal() as session:
                rows = (
                    await session.execute(select(NewsEvent).where(NewsEvent.id.in_(promotions)))
                ).scalars()
                for row in rows:
                    row.significance_tier = promotions[row.id]
                    job.count("promoted")
                await session.commit()
