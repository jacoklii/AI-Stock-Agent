"""Hermetic API smoke test — no Postgres, no network.

Covers the import-and-boot path (importing ``app.main`` proves the API boots) plus the wiring of
the two action endpoints to their workflows. The workflow ``run`` callables are monkeypatched so
the test stays hermetic — it asserts the route reaches the workflow and shapes the response, not
the workflow's external behaviour.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.workflows import deep_research, market_pulse

client = TestClient(app)


def test_health_ok() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_brief_run_invokes_workflow(monkeypatch) -> None:
    async def _stub(*, slot: str) -> None:
        assert slot == "on_demand"

    monkeypatch.setattr(market_pulse, "run", _stub)
    resp = client.post("/brief/run")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_research_followup_invokes_workflow(monkeypatch) -> None:
    async def _stub(*, query, company_id=None, industry_id=None, initiated_by="schedule", resume_state_id=None):
        return {"blocked": False, "answer": f"re: {query}", "sources": [1, 2]}

    monkeypatch.setattr(deep_research, "run", _stub)
    resp = client.post("/research/followup", json={"query": "nvidia"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["answer"] == "re: nvidia"
    assert body["sources"] == [1, 2]
