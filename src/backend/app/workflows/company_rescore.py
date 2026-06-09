"""Company re-scoring pipeline — dense fundamental + sentimental scores for deep coverage.

Event-triggered by news ingest (and re-run on schedule). Scores are dense and historical;
prose is sparse and only regenerated when a score shift crosses threshold. Deep scoring runs
ONLY on watchlist + industry_critical companies — the cost boundary.

Concurrency stop: one workflow per company (``company_lock``), small parallelism across them
(``gather_bounded``). Skeleton status: target resolution, input gathering, the score writes,
and the shift check are real; the score computation (``analysis/``) is deferred.
"""

from __future__ import annotations

from app.analysis import ScoreResult, score_fundamental, score_sentiment
from app.config import DEFAULT_THRESHOLDS
from app.db.enums import CoverageTier
from app.db.models.analysis import Fundamental, Sentimental
from app.db.session import SessionLocal, readonly_session
from app.tools.analysis import get_latest_scores
from app.tools.research import ScreenFilters, get_financials, get_news_events, get_price_history, screen_stocks
from app.workflows.concurrency import company_lock, gather_bounded
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_RESCORE

_SCORE_MODEL = {"fundamental": Fundamental, "sentimental": Sentimental}


async def _compute_score(kind: str, inputs: dict) -> ScoreResult:
    if kind == "fundamental":
        return score_fundamental(inputs["financials"], inputs["prices"])
    return score_sentiment(inputs["news"])


async def _resolve_targets(company_ids: list[int] | None) -> list[int]:
    if company_ids is not None:
        return company_ids
    async with readonly_session() as session:
        watchlist = await screen_stocks(
            session, filters=ScreenFilters(coverage_tier=CoverageTier.watchlist, limit=500)
        )
        critical = await screen_stocks(
            session, filters=ScreenFilters(coverage_tier=CoverageTier.industry_critical, limit=500)
        )
    return [c.company_id for c in watchlist + critical]


async def _rescore_one(company_id: int) -> None:
    async with company_lock(company_id):
        async with readonly_session() as session:
            inputs = {
                "financials": await get_financials(session, company_id=company_id),
                "news": await get_news_events(session, company_id=company_id, limit=50),
                "prices": await get_price_history(session, company_id=company_id, limit=120),
                "prior": await get_latest_scores(session, company_id=company_id),
            }

        rows = []
        for kind in ("fundamental", "sentimental"):
            result = await _compute_score(kind, inputs)
            rows.append(
                _SCORE_MODEL[kind](
                    company_id=company_id,
                    score=result.score,
                    scores=result.components,
                    rubric_version=result.rubric_version,
                    model_name=result.engine,
                )
            )

        async with SessionLocal() as session:
            session.add_all(rows)
            await session.commit()

        prior = inputs["prior"]
        shift = DEFAULT_THRESHOLDS["score_shift"]
        for kind, new_row in zip(("fundamental", "sentimental"), rows):
            prev = getattr(prior, kind)
            if prev is not None and abs(new_row.score - prev.score) >= shift:
                from app.workflows import prose_regeneration

                await prose_regeneration.run(company_id=company_id, kind=kind)


async def run(*, company_ids: list[int] | None = None) -> None:
    async with run_task(WF_RESCORE, params={"company_ids": company_ids or []}) as task:
        targets = await _resolve_targets(company_ids)
        task.count("companies", len(targets))
        await gather_bounded([_rescore_one(cid) for cid in targets])
