"""Sentiment scoring + prose-change detection — deterministic, no LLM.

Two deterministic jobs:
- ``score_sentiment`` rolls the per-event ``sentiment_score`` (-1..1, set by the agent at
  ingest) into a 0-100 axis, weighting more significant events more heavily.
- ``prose_changed`` is the embedding-similarity check the prose pipeline uses to decide whether
  a newly generated read differs enough from the previous row to be worth storing (keeping the
  prose table sparse by design). Cosine distance, threshold-gated.
"""

from __future__ import annotations

import math

from app.analysis.fundamental_score import ScoreResult
from app.db.enums import SignificanceTier
from app.db.payloads import ScoreComponents
from app.tools.tool_schema import NewsEventResult

RUBRIC_VERSION = "sentiment-v1"
ENGINE = "analysis.sentiment_analysis"
_NEUTRAL = 50.0

# More significant coverage carries more weight in the roll-up.
_TIER_WEIGHT = {
    SignificanceTier.routine: 1.0,
    SignificanceTier.notable: 2.0,
    SignificanceTier.significant: 4.0,
}

# Default cosine-distance threshold: prose is "changed" when it has drifted at least this far
# from the previous embedding. Conservative — sparse-by-design.
PROSE_CHANGE_DISTANCE = 0.12


def score_sentiment(news: list[NewsEventResult]) -> ScoreResult:
    """Significance-weighted mean of event sentiment, mapped -1..1 -> 0..100. No scored events
    -> neutral 50."""
    scored = [(e, e.sentiment_score) for e in news if e.sentiment_score is not None]
    if not scored:
        components = ScoreComponents({"mean_sentiment": 0.0, "events": 0.0, "significant_share": 0.0})
        return ScoreResult(_NEUTRAL, components, RUBRIC_VERSION, ENGINE)

    weighted_sum = sum(s * _TIER_WEIGHT[e.significance_tier] for e, s in scored)
    weight_total = sum(_TIER_WEIGHT[e.significance_tier] for e, _ in scored)
    mean = weighted_sum / weight_total if weight_total else 0.0
    significant = sum(1 for e, _ in scored if e.significance_tier is SignificanceTier.significant)

    headline = max(0.0, min(100.0, (mean + 1.0) * 50.0))
    components = ScoreComponents(
        {
            "mean_sentiment": round(mean, 4),
            "events": float(len(scored)),
            "significant_share": round(significant / len(scored), 4),
        }
    )
    return ScoreResult(round(headline, 2), components, RUBRIC_VERSION, ENGINE)


def _cosine_distance(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 1.0
    return 1.0 - dot / (na * nb)


def prose_changed(
    new_vec: list[float],
    prev_vec: list[float] | None,
    *,
    threshold: float = PROSE_CHANGE_DISTANCE,
) -> bool:
    """True when the new read is materially different from the previous one. No previous prose
    (or no stored embedding) -> always changed (the first read is always worth keeping)."""
    if not prev_vec:
        return True
    return _cosine_distance(new_vec, prev_vec) >= threshold
