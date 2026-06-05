"""Deterministic analysis — scoring math and prose-change detection. No LLM here.

Per STRUCTURE.md this folder is pure math: the fundamental/sentiment scoring formulas and the
embedding-similarity check used to decide whether newly generated prose differs enough from the
previous row to be worth storing. Reproducible and versioned (``rubric_version``) so old scores
stay interpretable; the LLM lives in ``agents/``, never here.
"""

from __future__ import annotations

from app.analysis.fundamental_score import ScoreResult, score_fundamental
from app.analysis.sentiment_analysis import prose_changed, score_sentiment

__all__ = ["ScoreResult", "score_fundamental", "score_sentiment", "prose_changed"]
