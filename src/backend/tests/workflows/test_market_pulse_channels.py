"""Hermetic tests for brief channel routing — no Postgres, no LLM, no notifier.

The contract under test: the brief goes to exactly the channels in ``brief_channels``;
external channels without an address are skipped; one failing channel never aborts the rest
(it is counted as ``send_failed`` on the task row).
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from app.db.enums import Channel
from app.db.payloads import UserChannels
from app.workflows.message import market_pulse
from app.workflows.runtime import TaskHandle


class _FakeSession:
    async def __aenter__(self) -> "_FakeSession":
        return self

    async def __aexit__(self, *exc: object) -> bool:
        return False


def _patch_seams(monkeypatch, *, channels: UserChannels, failing: set[Channel] = frozenset()):
    """Patch every seam of market_pulse.run(); returns (deliveries, handle-holder)."""
    deliveries: list[dict] = []
    holder: dict = {}

    @asynccontextmanager
    async def _fake_run_task(*args, **kwargs):
        holder["handle"] = TaskHandle(id=1)
        yield holder["handle"]

    @asynccontextmanager
    async def _fake_ro_session():
        yield None

    async def _brief_state(session, provider):
        return []

    async def _snapshot(instruments):
        return "snap"

    async def _user_channels():
        return channels

    async def _deliver(session, *, channel, **kwargs):
        if channel in failing:
            raise NotImplementedError(f"{channel} not implemented")
        deliveries.append({"channel": channel, **kwargs})

    monkeypatch.setattr(market_pulse, "run_task", _fake_run_task)
    monkeypatch.setattr(market_pulse, "readonly_session", _fake_ro_session)
    monkeypatch.setattr(market_pulse, "get_brief_state", _brief_state)
    monkeypatch.setattr(market_pulse, "get_market_provider", lambda: None)
    monkeypatch.setattr(market_pulse, "_generate_brief_snapshot", _snapshot)
    monkeypatch.setattr(market_pulse, "_user_channels", _user_channels)
    monkeypatch.setattr(market_pulse, "deliver", _deliver)
    monkeypatch.setattr(market_pulse, "SessionLocal", _FakeSession)
    return deliveries, holder


async def test_routes_to_email_and_in_app(monkeypatch) -> None:
    channels = UserChannels(email="me@example.com", brief_channels=["email", "in_app"])
    deliveries, _ = _patch_seams(monkeypatch, channels=channels)

    await market_pulse.run(slot="morning")

    sent = {d["channel"] for d in deliveries}
    assert sent == {Channel.email, Channel.in_app}
    email = next(d for d in deliveries if d["channel"] is Channel.email)
    assert email["to_addr"] == "me@example.com"
    assert "morning" in email["subject"]
    assert email["body"] == "snap"
    in_app = next(d for d in deliveries if d["channel"] is Channel.in_app)
    assert in_app["body"] == "snap"  # the ledger row carries the snapshot for /brief/latest


async def test_external_channel_without_address_is_skipped(monkeypatch) -> None:
    # Default brief_channels = [imessage, in_app] but no iMessage address configured.
    deliveries, _ = _patch_seams(monkeypatch, channels=UserChannels())

    await market_pulse.run(slot="midday")

    assert [d["channel"] for d in deliveries] == [Channel.in_app]


async def test_failing_channel_does_not_abort_the_rest(monkeypatch) -> None:
    channels = UserChannels(
        whatsapp="+15550100", brief_channels=["whatsapp", "in_app"]
    )
    deliveries, holder = _patch_seams(monkeypatch, channels=channels, failing={Channel.whatsapp})

    await market_pulse.run(slot="close")

    assert [d["channel"] for d in deliveries] == [Channel.in_app]
    assert holder["handle"].result.counts["send_failed"] == 1


async def test_imessage_routed_when_address_set(monkeypatch) -> None:
    channels = UserChannels(imessage="+15550101")  # default brief_channels includes imessage
    deliveries, _ = _patch_seams(monkeypatch, channels=channels)

    await market_pulse.run(slot="morning")

    imessage = next(d for d in deliveries if d["channel"] is Channel.imessage)
    assert imessage["text"] == "snap"
    assert imessage["to_addr"] == "+15550101"
