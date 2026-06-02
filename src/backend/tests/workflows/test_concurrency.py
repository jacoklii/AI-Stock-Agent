"""Per-company serialization + bounded cross-company parallelism (pure async, no DB)."""

from __future__ import annotations

import asyncio

from app.workflows.concurrency import company_lock, gather_bounded


async def _tracked_section(company_id: int, state: dict) -> None:
    async with company_lock(company_id):
        state["active"] += 1
        state["max_active"] = max(state["max_active"], state["active"])
        await asyncio.sleep(0.02)  # hold the section so overlap would be observable
        state["active"] -= 1


async def test_same_company_runs_serialize():
    state = {"active": 0, "max_active": 0}
    await asyncio.gather(*(_tracked_section(42, state) for _ in range(4)))
    assert state["max_active"] == 1  # never two at once for the same company


async def test_different_companies_run_concurrently():
    state = {"active": 0, "max_active": 0}
    await asyncio.gather(*(_tracked_section(cid, state) for cid in (1, 2, 3)))
    assert state["max_active"] >= 2  # distinct companies overlap


async def test_gather_bounded_preserves_order_and_caps_parallelism():
    state = {"active": 0, "max_active": 0}

    async def work(i: int) -> int:
        state["active"] += 1
        state["max_active"] = max(state["max_active"], state["active"])
        await asyncio.sleep(0.01)
        state["active"] -= 1
        return i

    results = await gather_bounded([work(i) for i in range(10)])
    assert results == list(range(10))
    assert state["max_active"] <= 4  # MAX_COMPANY_PARALLELISM
