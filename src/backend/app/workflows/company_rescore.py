"""Company re-scoring pipeline — dense fundamental + sentimental scores for deep coverage.

Event-triggered by news ingest (and re-run on schedule). Scores are dense and historical;
prose is sparse and only regenerated when a score shift crosses threshold. Deep scoring runs
ONLY on watchlist + flagged-sector companies — the cost boundary.

Concurrency stop: one workflow per company (``company_lock``), small parallelism across them
(``gather_bounded``). Skeleton status: target resolution, input gathering, the score writes,
and the shift check are real; the score computation (``analysis/``) is deferred.
"""

from __future__ import annotations

from app.config import DEFAULT_THRESHOLDS
from app.db.enums import CoverageTier, ProseKind
from app.db.models.analysis import FundamentalScore, SentimentalScore
from app.db.payloads import ScoreComponents
from app.db.session import SessionLocal, readonly_session
from app.tools.analysis import get_latest_scores
from app.tools.research import ScreenFilters, get_financials, get_news_events, get_price_history, screen_stocks
from app.workflows.concurrency import company_lock, gather_bounded
from app.workflows.runtime import run_job
from app.workflows.triggers import WF_RESCORE

_RUBRIC_VERSION = "v0"  # TODO(scoring): real rubric version from analysis/

_SCORE_MODEL = {ProseKind.fundamental: FundamentalScore, ProseKind.sentimental: SentimentalScore}


async def _compute_score(kind: ProseKind, inputs: dict) -> tuple[float, ScoreComponents, str]:
    """Deterministic score (0-100) + sub-component map + producing model name."""
    raise NotImplementedError(f"TODO(scoring): {kind.value} score from analysis/")


async def _resolve_targets(company_ids: list[int] | None) -> list[int]:
    if company_ids is not None:
        return company_ids
    async with readonly_session() as session:
        candidates = await screen_stocks(
            session, filters=ScreenFilters(coverage_tier=CoverageTier.watchlist, limit=1000)
        )
    return [c.company_id for c in candidates]


async def _rescore_one(company_id: int) -> None:
    async with company_lock(company_id):
        # 1. Gather inputs. — real
        async with readonly_session() as session:
            inputs = {
                "financials": await get_financials(session, company_id=company_id),
                "news": await get_news_events(session, company_id=company_id, limit=50),
                "prices": await get_price_history(session, company_id=company_id, limit=120),
                "prior": await get_latest_scores(session, company_id=company_id),
            }

        # 2. Compute both scores. — TODO(scoring)
        rows = []
        for kind in (ProseKind.fundamental, ProseKind.sentimental):
            score, components, model_name = await _compute_score(kind, inputs)
            rows.append(
                _SCORE_MODEL[kind](
                    company_id=company_id,
                    score=score,
                    components=components,
                    rubric_version=_RUBRIC_VERSION,
                    model_name=model_name,
                )
            )

        # 3. Persist the score rows. — real write
        async with SessionLocal() as session:
            session.add_all(rows)
            await session.commit()

        # 4. Threshold-crossing shift -> regenerate prose. — real check, threshold trigger
        prior = inputs["prior"]
        shift = DEFAULT_THRESHOLDS["score_shift"]
        for kind, new_row in zip((ProseKind.fundamental, ProseKind.sentimental), rows):
            prev = getattr(prior, kind.value)
            if prev is not None and abs(new_row.score - prev.score) >= shift:
                from app.workflows import prose_regeneration

                await prose_regeneration.run(company_id=company_id, kind=kind)


async def run(*, company_ids: list[int] | None = None) -> None:
    async with run_job(WF_RESCORE, params={"company_ids": company_ids or []}) as job:
        targets = await _resolve_targets(company_ids)
        job.count("companies", len(targets))
        await gather_bounded([_rescore_one(cid) for cid in targets])
