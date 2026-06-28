"""Hermetic tests for /digest/latest — the shared ``type=summary`` row needs shape-sniffing."""

from __future__ import annotations

from datetime import datetime, timezone

from app.db.models.analysis import Analysis
from app.db.payloads import AnalysisContent, AnalysisSupportingInputs

from fakes import FakeResult, FakeSession, use_session

_NOW = datetime(2026, 6, 11, 11, 0, tzinfo=timezone.utc)


def _summary_row(row_id: int, content: dict) -> Analysis:
    row = Analysis(
        content=AnalysisContent(**content),
        supporting_inputs=AnalysisSupportingInputs(news_event_ids=[7]),
        model_name="test-model",
    )
    row.id = row_id
    row.generated_at = _NOW
    return row


_DIGEST_SHAPE = {
    "top_snapshot": "Markets steady.",
    "sections": [
        {
            "section_title": "Semis",
            "snapshot": "Quiet day.",
            "article_refs": [],
            "key_tickers": ["NVDA"],
        }
    ],
}
_PROMOTION_SHAPE = {"topic": "NVDA coverage", "findings": "Sparse data.", "answer": None}


def test_digest_skips_promoted_research_rows(client) -> None:
    # Newest summary row is a promoted research session — the digest is the older row.
    rows = [_summary_row(2, _PROMOTION_SHAPE), _summary_row(1, _DIGEST_SHAPE)]
    use_session(FakeSession([FakeResult(scalars=rows)]))
    resp = client.get("/digest/latest")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == 1
    assert body["top_snapshot"] == "Markets steady."
    assert body["sections"][0]["key_tickers"] == ["NVDA"]


def test_digest_null_when_only_promotions_exist(client) -> None:
    use_session(FakeSession([FakeResult(scalars=[_summary_row(2, _PROMOTION_SHAPE)])]))
    resp = client.get("/digest/latest")
    assert resp.status_code == 200
    assert resp.json() is None


def test_digest_null_when_no_summary_rows(client) -> None:
    use_session(FakeSession([FakeResult(scalars=[])]))
    resp = client.get("/digest/latest")
    assert resp.status_code == 200
    assert resp.json() is None
