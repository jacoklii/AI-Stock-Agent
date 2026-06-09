"""Significance re-check pipeline — promote events that aged into importance.

An event judged routine at ingest can prove significant once the subsequent price/volume reaction
is known. This re-evaluates older events still inside their retention window against later price
action: a clear move boosts significance deterministically; a borderline move goes to the researcher
to reclassify. Promotions raise the float score toward 1.0.
"""

from __future__ import annotations

from sqlalchemy import select

from app.agents.researcher import get_researcher
from app.config import DEFAULT_THRESHOLDS
from app.db.models.news import NewsEvent
from app.db.session import SessionLocal, readonly_session
from app.tools.registry import TASK_SIGNIFICANCE
from app.tools.research import get_news_events, get_price_history
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_SIGNIFICANCE_RECHECK

# Events above this significance don't need rechecking.
_HIGH_SIGNIFICANCE = 0.70

# How much to boost significance on a clear price move (deterministic).
_BOOST = 0.25

# A move this fraction of the threshold is borderline — send to researcher instead.
_BORDERLINE_FRACTION = 0.70


def _move_pct(prices) -> float | None:
    closes = [p.close for p in prices if p.close is not None]
    if len(closes) < 2 or not closes[-1]:
        return None
    return abs(closes[0] - closes[-1]) / closes[-1] * 100.0


async def _reclassify(event) -> float:
    """Borderline cases go to the researcher for a refined significance estimate."""
    out = await get_researcher().run_task(TASK_SIGNIFICANCE, inputs={"event": event})
    return out.significance


async def run(*, lookback_limit: int = 200) -> None:
    threshold = DEFAULT_THRESHOLDS["price_move_pct"]
    async with run_task(WF_SIGNIFICANCE_RECHECK) as task:
        # 1. Candidates: stored events below the high-significance ceiling. — read tools
        promotions: dict[int, float] = {}
        async with readonly_session() as session:
            events = await get_news_events(session, limit=lookback_limit)
            candidates = [e for e in events if e.significance < _HIGH_SIGNIFICANCE]
            for event in candidates:
                if event.company_id is None:
                    continue
                prices = await get_price_history(session, company_id=event.company_id, limit=30)
                move = _move_pct(prices)
                if move is None:
                    continue
                if move >= threshold:
                    # Clear move — deterministic boost.
                    promotions[event.news_event_id] = min(1.0, event.significance + _BOOST)
                elif move >= threshold * _BORDERLINE_FRACTION:
                    # Ambiguous — researcher decides.
                    new_sig = await _reclassify(event)
                    if new_sig > event.significance:
                        promotions[event.news_event_id] = new_sig
        task.count("reviewed", len(candidates))

        # 2. Apply promotions. — write
        if promotions:
            async with SessionLocal() as session:
                rows = (
                    await session.execute(select(NewsEvent).where(NewsEvent.id.in_(promotions)))
                ).scalars()
                for row in rows:
                    row.significance = promotions[row.id]
                    task.count("promoted")
                await session.commit()
