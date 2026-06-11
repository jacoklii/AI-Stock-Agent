"""Market brief pipeline — brief movers + snapshot to iMessage/WhatsApp + in-app inbox.

Triggered morning/midday/close (scheduled) and on demand (from the API). The brief set is the
fixed core (BRIEF_CORE) + the user's mega-caps; ``get_brief_state`` composes and quotes it live.

The brief is **transient** (ARCHITECTURE.md): it is regenerated live from quotes and never
persisted as its own row. The only durable trace is the ``notifications`` ledger written by the
shared ``deliver`` helper (iMessage when an address is set, plus the in-app inbox mirror).
"""

from __future__ import annotations

from sqlalchemy import select

from app.agents.researcher import get_researcher
from app.db.enums import Channel
from app.db.models.user import UserPreferences
from app.db.payloads import BriefInstrument
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


async def _imessage_address() -> str | None:
    async with readonly_session() as session:
        prefs = (
            await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
        ).scalar_one_or_none()
    return prefs.channels.imessage if prefs and prefs.channels else None


async def run(*, slot: str = "on_demand") -> None:
    async with run_task(WF_MARKET_PULSE, params={"slot": slot}) as task:
        async with readonly_session() as session:
            instruments = await get_brief_state(session, get_market_provider())
        task.count("instruments", len(instruments))

        snapshot = await _generate_brief_snapshot(instruments)
        address = await _imessage_address()

        async with SessionLocal() as session:
            if address:
                await deliver(
                    session,
                    channel=Channel.imessage,
                    content_hash=content_hash_for("brief", slot, "imessage", snapshot),
                    template="brief",
                    ref_type="brief",
                    to_addr=address,
                    text=snapshot,
                )
            await deliver(
                session,
                channel=Channel.in_app,
                content_hash=content_hash_for("brief", slot, "in_app", snapshot),
                template="brief",
                ref_type="brief",
            )
        task.message(f"brief {slot} prepared")
