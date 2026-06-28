"""Hermetic tests for the budget + preferences surface."""

from __future__ import annotations

from app.api.routes import agent as agent_routes
from app.db.models.user import UserPreferences
from app.db.payloads import UserChannels

from fakes import FakeResult, FakeSession, use_session


def _prefs(weekly: int | None = 100_000) -> UserPreferences:
    row = UserPreferences(
        interested_sectors=["Technology"],
        critical_industries=[3],
        brief_user=["NVDA"],
        weekly_token_budget=weekly,
        channels=UserChannels(email="me@example.com"),
    )
    row.id = 1
    return row


def test_budget_view(monkeypatch, client) -> None:
    async def _spent(session):
        return 25_000

    monkeypatch.setattr(agent_routes, "spent_last_7_days", _spent)
    use_session(FakeSession([FakeResult(scalar=_prefs())]))

    resp = client.get("/budget")
    assert resp.status_code == 200
    assert resp.json() == {
        "weekly_token_budget": 100_000,
        "spent_7d": 25_000,
        "remaining": 75_000,
    }


def test_budget_view_uncapped(monkeypatch, client) -> None:
    async def _spent(session):
        return 25_000

    monkeypatch.setattr(agent_routes, "spent_last_7_days", _spent)
    use_session(FakeSession([FakeResult(scalar=_prefs(weekly=None))]))

    body = client.get("/budget").json()
    assert body["weekly_token_budget"] is None
    assert body["remaining"] is None


def test_update_budget(client) -> None:
    row = _prefs()
    fake = FakeSession([FakeResult(scalar=row)])
    use_session(fake)

    resp = client.put("/preferences/budget", json={"weekly_token_budget": 50_000})
    assert resp.status_code == 200
    assert row.weekly_token_budget == 50_000
    assert resp.json()["weekly_token_budget"] == 50_000
    assert fake.commits == 1


def test_update_channels(client) -> None:
    row = _prefs()
    fake = FakeSession([FakeResult(scalar=row)])
    use_session(fake)

    resp = client.put(
        "/preferences/channels",
        json={
            "email": "me@example.com",
            "digest_channels": ["email", "in_app"],
            "brief_channels": ["email", "in_app"],
        },
    )
    assert resp.status_code == 200
    assert isinstance(row.channels, UserChannels)
    assert row.channels.brief_channels == ["email", "in_app"]
    assert resp.json()["channels"]["brief_channels"] == ["email", "in_app"]


def test_update_channels_rejects_unknown_channel(client) -> None:
    use_session(FakeSession())
    resp = client.put("/preferences/channels", json={"digest_channels": ["carrier_pigeon"]})
    assert resp.status_code == 422


def test_preferences_include_budget_and_channels(client) -> None:
    use_session(FakeSession([FakeResult(scalar=_prefs())]))
    body = client.get("/preferences").json()
    assert body["weekly_token_budget"] == 100_000
    assert body["channels"]["email"] == "me@example.com"
