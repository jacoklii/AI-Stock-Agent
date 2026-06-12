"""Hermetic tests for /brief/latest and the inbox content fields."""

from __future__ import annotations

from datetime import datetime, timezone

from app.db.enums import Channel
from app.db.models.delivery import Notification

from fakes import FakeResult, FakeSession, use_session

_NOW = datetime(2026, 6, 11, 12, 30, tzinfo=timezone.utc)


def _notification(**overrides) -> Notification:
    row = Notification(
        channel=Channel.in_app,
        template="brief",
        content_hash="abc",
        ref_type="brief",
        title="Market brief — morning",
        body="Futures flat; gold bid.",
    )
    row.id = 1
    row.sent_at = _NOW
    for key, value in overrides.items():
        setattr(row, key, value)
    return row


def test_brief_latest_returns_stored_snapshot(client) -> None:
    use_session(FakeSession([FakeResult(scalar=_notification())]))
    resp = client.get("/brief/latest")
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Market brief — morning"
    assert body["body"] == "Futures flat; gold bid."


def test_brief_latest_404_before_first_delivery(client) -> None:
    use_session(FakeSession([FakeResult(scalar=None)]))
    assert client.get("/brief/latest").status_code == 404


def test_inbox_items_carry_title_and_body(client) -> None:
    use_session(FakeSession([FakeResult(scalars=[_notification()])]))
    resp = client.get("/inbox")
    assert resp.status_code == 200
    item = resp.json()[0]
    assert item["title"] == "Market brief — morning"
    assert item["body"] == "Futures flat; gold bid."
