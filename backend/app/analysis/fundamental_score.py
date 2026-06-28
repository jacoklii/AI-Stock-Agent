"""Fundamental scoring — deterministic 0-100 from stored financials + prices.

Pure function over the tool DTOs the re-score workflow already gathers (``FinancialRow`` newest
first, ``PriceRow`` newest first). Produces a headline score plus a ``components`` breakdown so
the number stays inspectable, and a ``rubric_version`` so a formula change doesn't silently
reinterpret old rows. This is NOT a buy/sell call — it is a numeric read the human interprets.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.db.payloads import ScorePayload
from app.tools.tool_schema import FinancialRow, PriceRow

RUBRIC_VERSION = "fundamental-v1"
ENGINE = "analysis.fundamental_score"

# Sub-score weights (sum to 1.0).
_WEIGHTS = {"valuation": 0.30, "growth": 0.30, "profitability": 0.30, "leverage": 0.10}
_NEUTRAL = 50.0


@dataclass
class ScoreResult:
    """A scored axis: the headline 0-100, its sub-scores, and the producing engine + rubric."""

    score: float
    components: ScorePayload
    rubric_version: str
    engine: str


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _valuation(latest: FinancialRow) -> float:
    """Lower P/E scores higher; neutral when unknown. Banded, not a market call."""
    if latest.pe is None or latest.pe <= 0:
        return _NEUTRAL
    # ~10x -> strong, ~40x+ -> weak, linear between.
    return _clamp(100.0 - (latest.pe - 10.0) * (60.0 / 30.0))


def _growth(rows: list[FinancialRow]) -> float:
    """Revenue trend newest-vs-oldest in the window. Neutral without two comparable points."""
    revs = [r.revenue for r in rows if r.revenue is not None and r.revenue != 0]
    if len(revs) < 2:
        return _NEUTRAL
    newest, oldest = revs[0], revs[-1]
    pct = (newest - oldest) / abs(oldest) * 100.0
    return _clamp(_NEUTRAL + pct)  # +50% growth -> 100, -50% -> 0


def _profitability(latest: FinancialRow) -> float:
    """EBITDA margin proxy. Neutral when revenue/ebitda missing."""
    if not latest.revenue or latest.ebitda is None:
        return _NEUTRAL
    margin = latest.ebitda / latest.revenue * 100.0
    return _clamp(margin * 2.0)  # 50% margin -> 100


def _leverage(latest: FinancialRow) -> float:
    """Capex intensity vs EBITDA as a light reinvestment/leverage proxy."""
    if not latest.ebitda or latest.capex is None:
        return _NEUTRAL
    intensity = abs(latest.capex) / abs(latest.ebitda) * 100.0
    return _clamp(100.0 - intensity)  # heavy capex burn scores lower


def score_fundamental(
    financials: list[FinancialRow], prices: list[PriceRow] | None = None
) -> ScoreResult:
    """Compute the fundamental score. Empty financials -> a neutral 50 (out-of-scope companies
    simply have nothing to score; that's the cost boundary, not an error)."""
    if not financials:
        components = ScorePayload({k: _NEUTRAL for k in _WEIGHTS})
        return ScoreResult(_NEUTRAL, components, RUBRIC_VERSION, ENGINE)

    latest = financials[0]
    subs = {
        "valuation": _valuation(latest),
        "growth": _growth(financials),
        "profitability": _profitability(latest),
        "leverage": _leverage(latest),
    }
    headline = sum(subs[k] * w for k, w in _WEIGHTS.items())
    return ScoreResult(
        score=round(_clamp(headline), 2),
        components=ScorePayload({k: round(v, 2) for k, v in subs.items()}),
        rubric_version=RUBRIC_VERSION,
        engine=ENGINE,
    )
