"""Hermetic tests for the research-session routes — no Postgres, no LLM.

The contract under test: the open route gates synchronously (409 on budget/capacity) and fires
the session in the background (202 + state_id); close delegates to the workflow's
``close_user_session``; redirect updates an open state row and refuses a closed one; the
background runner persists an unflushed answer (and only then).
"""

from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace

from app.api.routes import research as research_routes
from app.db.enums import StateStatus
from app.db.models.state import ResearchState
from app.workflows.research import deep_research

from fakes import FakeResult, FakeSession, use_session

_NOW = datetime(2026, 6, 11, 12, 0, tzinfo=timezone.utc)


def _state_row(state_id: int = 7, status: StateStatus = StateStatus.open) -> ResearchState:
    row = ResearchState(topic="nvidia supply chain", status=status, initiated_by="schedule")
    row.id = state_id
    row.opened_at = _NOW
    row.last_active_at = _NOW
    row.closed_at = None
    return row


def _uncapped(monkeypatch) -> None:
    async def _remaining(session):
        return None

    monkeypatch.setattr(research_routes, "remaining_weekly_budget", _remaining)


def test_open_session_returns_202_and_spawns(monkeypatch, client) -> None:
    _uncapped(monkeypatch)
    use_session(FakeSession([FakeResult(scalars=[])]))  # no open sessions

    async def _open(session, *, topic, parent_state_id=None, initiated_by="schedule"):
        assert topic == "nvidia supply chain"
        assert initiated_by == "user"  # a session opened from the interface is user-requested
        return SimpleNamespace(state_id=42)

    spawned: list = []
    monkeypatch.setattr(research_routes, "open_research", _open)
    monkeypatch.setattr(
        research_routes, "_spawn", lambda coro: (spawned.append(coro), coro.close())
    )

    resp = client.post("/research", json={"topic": "nvidia supply chain"})
    assert resp.status_code == 202
    assert resp.json() == {"state_id": 42, "status": "started"}
    assert len(spawned) == 1


def test_open_session_409_when_budget_exhausted(monkeypatch, client) -> None:
    async def _remaining(session):
        return 0

    monkeypatch.setattr(research_routes, "remaining_weekly_budget", _remaining)
    use_session(FakeSession())

    resp = client.post("/research", json={"topic": "anything material"})
    assert resp.status_code == 409
    assert "budget" in resp.json()["detail"]


def test_open_session_409_at_capacity(monkeypatch, client) -> None:
    _uncapped(monkeypatch)
    rows = [_state_row(state_id=i) for i in (1, 2, 3)]  # at deep_research_max_active
    for i, row in enumerate(rows):
        row.topic = f"unrelated topic {i}"
    use_session(FakeSession([FakeResult(scalars=rows)]))

    resp = client.post("/research", json={"topic": "anything material"})
    assert resp.status_code == 409
    assert "max active" in resp.json()["detail"]


def test_open_session_dup_topic_is_idempotent(monkeypatch, client) -> None:
    """Re-posting an open session's topic returns its state_id — no second spawn."""
    _uncapped(monkeypatch)
    use_session(FakeSession([FakeResult(scalars=[_state_row(state_id=7)])]))

    spawned: list = []
    monkeypatch.setattr(
        research_routes, "_spawn", lambda coro: (spawned.append(coro), coro.close())
    )

    # Same topic up to whitespace/case — the normalized comparison absorbs both.
    resp = client.post("/research", json={"topic": "  Nvidia   SUPPLY chain "})
    assert resp.status_code == 202
    assert resp.json()["state_id"] == 7
    assert spawned == []


def test_close_session_delegates_to_workflow(monkeypatch, client) -> None:
    captured = {}

    async def _close(state_id, *, promote=False):
        captured.update(state_id=state_id, promote=promote)
        return {"found": True, "promoted": promote, "closed": True}

    monkeypatch.setattr(deep_research, "close_user_session", _close)
    resp = client.post("/research/7/close", json={"promote": True})
    assert resp.status_code == 200
    assert resp.json() == {"state_id": 7, "promoted": True, "closed": True}
    assert captured == {"state_id": 7, "promote": True}


def test_close_session_404_when_missing(monkeypatch, client) -> None:
    async def _close(state_id, *, promote=False):
        return {"found": False, "promoted": False, "closed": False}

    monkeypatch.setattr(deep_research, "close_user_session", _close)
    assert client.post("/research/999/close", json={}).status_code == 404


def test_redirect_steers_without_clobbering_topic(client, monkeypatch) -> None:
    """A redirect queues a live steer for the running session and reflects the new focus in
    current_task, but preserves the session's original topic (its identity)."""
    pushed: list[tuple[int, str]] = []
    monkeypatch.setattr(
        research_routes.deep_research,
        "push_redirect",
        lambda state_id, text: pushed.append((state_id, text)),
    )
    row = _state_row()
    original_topic = row.topic
    fake = FakeSession([FakeResult(scalar=row)])
    use_session(fake)

    resp = client.post("/research/7/redirect", json={"topic": "TSMC exposure"})
    assert resp.status_code == 200
    assert pushed == [(7, "TSMC exposure")]  # the running loop will pick this up
    assert row.topic == original_topic  # original question preserved, not replaced
    assert row.current_task == "TSMC exposure"  # new focus surfaced for the UI
    assert fake.commits == 1


def test_redirect_409_on_closed_session(client) -> None:
    use_session(FakeSession([FakeResult(scalar=_state_row(status=StateStatus.closed))]))
    assert client.post("/research/7/redirect", json={"topic": "x"}).status_code == 409


def test_list_sessions(client) -> None:
    use_session(FakeSession([FakeResult(scalars=[_state_row()])]))
    resp = client.get("/research?status=open")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["state_id"] == 7
    assert body[0]["status"] == "open"


async def test_background_runner_persists_unflushed_answer(monkeypatch) -> None:
    flushed: list[dict] = []

    async def _run(**kwargs):
        assert kwargs["resume_state_id"] == 7
        assert kwargs["initiated_by"] == "user"
        return {
            "blocked": False,
            "paused": False,
            "answer": "the answer",
            "sources": [3],
            "source_urls": ["https://example.com/r"],
        }

    class _FakeSessionLocal:
        async def __aenter__(self):
            return None

        async def __aexit__(self, *exc):
            return False

    async def _get_state(session, *, state_id):
        return SimpleNamespace(state_id=state_id, findings=None)

    async def _update(session, **fields):
        flushed.append(fields)

    monkeypatch.setattr(deep_research, "run", _run)
    monkeypatch.setattr(research_routes, "SessionLocal", _FakeSessionLocal)
    monkeypatch.setattr("app.tools.state.get_research_state", _get_state)
    monkeypatch.setattr("app.tools.state.update_research", _update)

    body = research_routes.ResearchOpenRequest(topic="nvidia supply chain")
    await research_routes._run_user_session(7, body)
    assert flushed == [
        {
            "state_id": 7,
            "findings": "the answer",
            "source_ids": [3],
            "source_urls": ["https://example.com/r"],
        }
    ]
