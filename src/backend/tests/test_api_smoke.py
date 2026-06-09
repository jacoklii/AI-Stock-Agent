"""Hermetic API smoke test — no Postgres, no network.

Covers the import-and-boot path (importing ``app.main`` proves the API is decoupled from the
deferred workflow/tool pipelines) plus the two contract behaviours that hold without a database:
``/health`` is live, and the deferred action endpoints answer ``501`` rather than erroring.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_brief_run_deferred() -> None:
    assert client.post("/brief/run").status_code == 501


def test_research_followup_deferred() -> None:
    resp = client.post("/research/followup", json={"query": "anything"})
    assert resp.status_code == 501
