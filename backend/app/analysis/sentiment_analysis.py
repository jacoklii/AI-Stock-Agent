"""Sentiment scoring + prose-change detection — deterministic, no LLM.

Two deterministic jobs:
- ``score_sentiment`` uses the per-event ``significance`` score (0-1, set at ingest) as a
  weight for the event pool. Directionality (bearish/bullish) is deferred until LLM-based
  per-event sentiment classification lands; for now the score reflects coverage density.
- ``prose_changed`` is the embedding-similarity check the prose pipeline uses to decide whether
  a newly generated read differs enough from the previous row to be worth storing (keeping the
  prose table sparse by design). Cosine distance, threshold-gated.
"""

from __future__ import annotations

import math

from app.analysis.fundamental_score import ScoreResult
from app.db.payloads import ScorePayload
from app.tools.tool_schema import NewsEventResult

RUBRIC_VERSION = "sentiment-v1"
ENGINE = "analysis.sentiment_analysis"
_NEUTRAL = 50.0

# Default cosine-distance threshold: prose is "changed" when it has drifted at least this far
# from the previous embedding. Conservative — sparse-by-design.
PROSE_CHANGE_DISTANCE = 0.12


def score_sentiment(news: list[NewsEventResult]) -> ScoreResult:
    """Significance-weighted event density mapped to 0-100. High-significance coverage nudges
    the score above neutral; direction awaits per-event LLM classification."""
    if not news:
        components = ScorePayload({"density": 0.0, "events": 0.0, "mean_significance": 0.0})
        return ScoreResult(_NEUTRAL, components, RUBRIC_VERSION, ENGINE)

    total = sum(e.significance for e in news)
    mean_sig = total / len(news)
    # Map mean significance (0-1) to a 50-70 range: neutral when no meaningful news,
    # capped near 70 until directional sentiment is available.
    headline = max(0.0, min(100.0, _NEUTRAL + mean_sig * 20.0))
    components = ScorePayload(
        {
            "density": round(total, 4),
            "events": float(len(news)),
            "mean_significance": round(mean_sig, 4),
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
