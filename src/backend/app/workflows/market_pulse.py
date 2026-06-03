"""Market pulse pipeline — brief movers + snapshot to iMessage/WhatsApp + in-app inbox.

Triggered morning/midday/close (scheduled) and on demand (from the API). The pulse set is the
fixed core + the user's mega-caps; ``get_pulse_state`` already composes and quotes it live.

Skeleton status: the live fetch and the persisted ``pulse_runs`` row are real; the snapshot
prose (agent) and the channel send (notifier) are deferred — isolated in named helpers that
raise ``NotImplementedError`` so this ``run`` reads as the full pipeline.
"""

from __future__ import annotations

from app.db.enums import PulseSlot
from app.db.models.delivery import PulseRun
from app.db.payloads import PulseInstrument
from app.db.session import SessionLocal, readonly_session
from app.providers.market import get_market_provider
from app.tools.delivery import check_dedupe
from app.tools.research import get_pulse_state
from app.workflows.runtime import run_job
from app.workflows.triggers import WF_MARKET_PULSE


async def _generate_pulse_snapshot(instruments: list[PulseInstrument]) -> str:
    """Researcher writes a short market-movement snapshot from the pulse readings."""
    raise NotImplementedError("TODO(agent): pulse_snapshot from instruments")


async def _send_pulse(snapshot: str, instruments: list[PulseInstrument], slot: PulseSlot) -> None:
    """Send the brief on iMessage/WhatsApp and mirror it into the in-app inbox
    (writing ``notification_history`` with a dedupe key)."""
    raise NotImplementedError("TODO(notifier): send brief + write notification_history")


async def run(*, slot: str = "on_demand") -> None:
    pulse_slot = PulseSlot(slot)
    async with run_job(WF_MARKET_PULSE, params={"slot": slot}) as job:
        # 1. Live pulse-set quotes (fixed core + user mega-caps). — real
        async with readonly_session() as session:
            instruments = await get_pulse_state(session, get_market_provider())
        job.count("instruments", len(instruments))

        # 2. Snapshot prose. — TODO(agent)
        snapshot = await _generate_pulse_snapshot(instruments)

        # 3. Persist the pulse run. — real write
        async with SessionLocal() as session:
            session.add(
                PulseRun(slot=pulse_slot, pulse_snapshot=snapshot, instruments=instruments)
            )
            await session.commit()

        # 4. Dedupe + deliver. — dedupe real, send TODO(notifier)
        async with readonly_session() as session:
            already = await check_dedupe(session, dedupe_key=f"pulse:{slot}")
        if not already.already_sent:
            await _send_pulse(snapshot, instruments, pulse_slot)
        job.message(f"pulse {slot} prepared")
