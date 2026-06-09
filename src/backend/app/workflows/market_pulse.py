"""Market brief pipeline — brief movers + snapshot to iMessage/WhatsApp + in-app inbox.

Triggered morning/midday/close (scheduled) and on demand (from the API). The brief set is the
fixed core (BRIEF_CORE) + the user's mega-caps; ``get_brief_state`` composes and quotes it live.
"""

from __future__ import annotations

import hashlib

from sqlalchemy import select

from app.agents.researcher import get_researcher
from app.db.enums import Channel, PulseSlot
from app.db.models.delivery import BriefRun, Notification
from app.db.models.user import UserPreferences
from app.db.payloads import BriefInstrument
from app.db.session import SessionLocal, readonly_session
from app.providers.market import get_market_provider
from app.providers.notifier import get_notifier
from app.tools.delivery import check_dedupe
from app.tools.registry import TASK_PULSE_SNAPSHOT
from app.tools.research import get_brief_state
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_MARKET_PULSE


async def _generate_brief_snapshot(instruments: list[BriefInstrument]) -> str:
    out = await get_researcher().run_task(
        TASK_PULSE_SNAPSHOT, inputs={"instruments": instruments}
    )
    return out.snapshot


async def _imessage_address() -> str | None:
    async with readonly_session() as session:
        prefs = (
            await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
        ).scalar_one_or_none()
    return prefs.channels.imessage if prefs and prefs.channels else None


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:64]


async def _send_brief(snapshot: str, slot: str, brief_run_id: int) -> None:
    address = await _imessage_address()
    async with SessionLocal() as session:
        if address:
            await get_notifier().send_message(to_addr=address, text=snapshot, channel=Channel.imessage)
            session.add(
                Notification(
                    channel=Channel.imessage,
                    template="brief",
                    ref_type="brief_run",
                    ref_id=brief_run_id,
                    content_hash=_hash(f"brief:{slot}:imessage:{snapshot}"),
                )
            )
        session.add(
            Notification(
                channel=Channel.in_app,
                template="brief",
                ref_type="brief_run",
                ref_id=brief_run_id,
                content_hash=_hash(f"brief:{slot}:in_app:{snapshot}"),
            )
        )
        await session.commit()


async def run(*, slot: str = "on_demand") -> None:
    brief_slot = PulseSlot(slot)
    async with run_task(WF_MARKET_PULSE, params={"slot": slot}) as task:
        async with readonly_session() as session:
            instruments = await get_brief_state(session, get_market_provider())
        task.count("instruments", len(instruments))

        snapshot = await _generate_brief_snapshot(instruments)

        async with SessionLocal() as session:
            brief_run = BriefRun(slot=brief_slot, brief_snapshot=snapshot, instruments=instruments)
            session.add(brief_run)
            await session.commit()
            brief_run_id = brief_run.id

        content_hash = _hash(f"brief:{slot}:imessage:{snapshot}")
        async with readonly_session() as session:
            already = await check_dedupe(session, content_hash=content_hash)
        if not already.already_sent:
            await _send_brief(snapshot, slot, brief_run_id)
        task.message(f"brief {slot} prepared")
