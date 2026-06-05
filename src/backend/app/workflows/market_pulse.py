"""Market pulse pipeline — brief movers + snapshot to iMessage/WhatsApp + in-app inbox.

Triggered morning/midday/close (scheduled) and on demand (from the API). The pulse set is the
fixed core + the user's mega-caps; ``get_pulse_state`` already composes and quotes it live.

Now fully wired: the live fetch and the ``pulse_runs`` write are deterministic; the researcher
writes the brief snapshot; the notifier sends it to iMessage and the ``notification_history``
ledger is written (dedupe-guarded) including the in-app mirror.
"""

from __future__ import annotations

from sqlalchemy import select

from app.agents.researcher import get_researcher
from app.db.enums import Channel, PulseSlot
from app.db.models.delivery import NotificationHistory, PulseRun
from app.db.models.user import UserPreferences
from app.db.payloads import PulseInstrument
from app.db.session import SessionLocal, readonly_session
from app.providers.market import get_market_provider
from app.providers.notifier import get_notifier
from app.tools.delivery import check_dedupe
from app.tools.registry import TASK_PULSE_SNAPSHOT
from app.tools.research import get_pulse_state
from app.workflows.runtime import run_job
from app.workflows.triggers import WF_MARKET_PULSE


async def _generate_pulse_snapshot(instruments: list[PulseInstrument]) -> str:
    """Researcher writes a short market-movement snapshot from the pulse readings."""
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


async def _send_pulse(snapshot: str, slot: str, pulse_run_id: int) -> None:
    """Send the brief on iMessage and mirror it into the in-app inbox (ledger writes)."""
    address = await _imessage_address()
    async with SessionLocal() as session:
        if address:
            await get_notifier().send_message(to_addr=address, text=snapshot, channel=Channel.imessage)
            session.add(
                NotificationHistory(
                    channel=Channel.imessage,
                    template="pulse",
                    ref_type="pulse_run",
                    ref_id=pulse_run_id,
                    dedupe_key=f"pulse:{slot}:imessage",
                )
            )
        session.add(
            NotificationHistory(
                channel=Channel.in_app,
                template="pulse",
                ref_type="pulse_run",
                ref_id=pulse_run_id,
                dedupe_key=f"pulse:{slot}:in_app",
            )
        )
        await session.commit()


async def run(*, slot: str = "on_demand") -> None:
    pulse_slot = PulseSlot(slot)
    async with run_job(WF_MARKET_PULSE, params={"slot": slot}) as job:
        # 1. Live pulse-set quotes (fixed core + user mega-caps). — yFinance
        async with readonly_session() as session:
            instruments = await get_pulse_state(session, get_market_provider())
        job.count("instruments", len(instruments))

        # 2. Snapshot prose. — researcher
        snapshot = await _generate_pulse_snapshot(instruments)

        # 3. Persist the pulse run. — write
        async with SessionLocal() as session:
            pulse_run = PulseRun(slot=pulse_slot, pulse_snapshot=snapshot, instruments=instruments)
            session.add(pulse_run)
            await session.commit()
            pulse_run_id = pulse_run.id

        # 4. Dedupe + deliver. — dedupe + notifier
        async with readonly_session() as session:
            already = await check_dedupe(session, dedupe_key=f"pulse:{slot}:imessage")
        if not already.already_sent:
            await _send_pulse(snapshot, slot, pulse_run_id)
        job.message(f"pulse {slot} prepared")
