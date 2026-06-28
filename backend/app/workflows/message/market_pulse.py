"""Market brief pipeline — brief movers + snapshot, routed per the user's brief channels.

Triggered morning/midday/close (scheduled) and on demand (from the API). The brief set is the
fixed core (BRIEF_CORE) + the user's mega-caps; ``get_brief_state`` composes and quotes it live.

The brief is **transient** (ARCHITECTURE.md): it is regenerated live from quotes and never
persisted as its own row. The only durable trace is the ``notifications`` ledger written by the
shared ``deliver`` helper — which channels that covers comes from ``UserPreferences.channels
.brief_channels`` (default iMessage + in-app; email works on any host, iMessage only on macOS).
One failing channel never aborts the rest — the failure is counted on the task row.
"""

from __future__ import annotations

from sqlalchemy import select

from app.agents.researcher import get_researcher
from app.db.enums import Channel
from app.db.models.user import UserPreferences
from app.db.payloads import BriefInstrument, UserChannels
from app.db.session import SessionLocal, readonly_session
from app.providers.market import get_market_provider
from app.tools.delivery import content_hash_for, deliver
from app.tools.registry import TASK_PULSE_SNAPSHOT
from app.tools.research import get_brief_state
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_MARKET_PULSE


async def _generate_brief_snapshot(instruments: list[BriefInstrument]) -> str:
    out = await get_researcher().run_task(TASK_PULSE_SNAPSHOT, inputs={"instruments": instruments})
    return out.snapshot


async def _user_channels() -> UserChannels:
    async with readonly_session() as session:
        prefs = (
            await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
        ).scalar_one_or_none()
    return prefs.channels if prefs and prefs.channels else UserChannels()


_ADDRESS_FIELD = {
    Channel.email: "email",
    Channel.imessage: "imessage",
    Channel.whatsapp: "whatsapp",
}


async def run(*, slot: str = "on_demand") -> None:
    async with run_task(WF_MARKET_PULSE, params={"slot": slot}) as task:
        async with readonly_session() as session:
            instruments = await get_brief_state(session, get_market_provider())
        task.count("instruments", len(instruments))

        snapshot = await _generate_brief_snapshot(instruments)
        channels = await _user_channels()
        title = f"Market brief — {slot}"

        async with SessionLocal() as session:
            for name in channels.brief_channels:
                try:
                    channel = Channel(name)
                except ValueError:
                    task.count("unknown_channel")
                    continue
                to_addr = (
                    getattr(channels, _ADDRESS_FIELD[channel]) if channel in _ADDRESS_FIELD else None
                )
                if channel is not Channel.in_app and not to_addr:
                    continue  # external channel with no address configured
                try:
                    await deliver(
                        session,
                        channel=channel,
                        content_hash=content_hash_for("brief", slot, channel.value, snapshot),
                        template="brief",
                        ref_type="brief",
                        to_addr=to_addr,
                        subject=title,
                        body=snapshot if channel in (Channel.email, Channel.in_app) else None,
                        text=snapshot if channel in (Channel.imessage, Channel.whatsapp) else None,
                    )
                    task.count(f"sent_{channel.value}")
                except Exception:
                    # One broken channel (e.g. WhatsApp unimplemented, SMTP down) must not
                    # abort the others; the count keeps the failure visible on the task row.
                    task.count("send_failed")
        task.message(f"brief {slot} prepared")
