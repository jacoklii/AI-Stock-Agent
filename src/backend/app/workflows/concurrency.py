"""Concurrency stops: one workflow per company, small cross-company parallelism, named slots.

The architecture's concurrency rule has two halves:

- *one workflow per company* — ``company_lock(company_id)`` serializes all work touching a
  given company, so two runs can't race on the same rows.
- *small parallelism across companies* — ``company_gate()`` is a bounded semaphore capping how
  many companies are processed at once; ``gather_bounded`` fans a coroutine out under that cap.

``workflow_slot(name)`` is the third primitive: non-blocking exclusivity for one named workflow,
for the runs that can fire from several directions at once (hourly cron, inline digest call,
event-driven wakeup) but must not overlap. A skipped run is fine — the holder is doing the work.

These are in-process primitives, which is exactly right for the v1 single always-on host. If
this ever scales to multiple processes, the per-company lock becomes a Postgres advisory lock
(``pg_advisory_xact_lock(company_id)``) — that's the one line that would change.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Awaitable, Iterable
from contextlib import asynccontextmanager
from typing import TypeVar

T = TypeVar("T")

# Small by design (see Data scaling targets: ~50–100 watchlist companies, batch cadence).
MAX_COMPANY_PARALLELISM = 4

_company_locks: dict[int, asyncio.Lock] = {}
_locks_guard = asyncio.Lock()
_company_gate = asyncio.Semaphore(MAX_COMPANY_PARALLELISM)


@asynccontextmanager
async def company_lock(company_id: int) -> AsyncIterator[None]:
    """Serialize work for one ``company_id``. Different companies don't contend; the same one
    waits its turn."""
    async with _locks_guard:
        lock = _company_locks.setdefault(company_id, asyncio.Lock())
    async with lock:
        yield


@asynccontextmanager
async def company_gate() -> AsyncIterator[None]:
    """Bound how many companies run concurrently across the whole process."""
    async with _company_gate:
        yield


_workflow_slots: dict[str, asyncio.Lock] = {}


@asynccontextmanager
async def workflow_slot(name: str) -> AsyncIterator[bool]:
    """Non-blocking exclusivity for one named workflow: yields ``False`` (caller skips) when a
    run already holds the slot, ``True`` after acquiring it. Safe in cooperative asyncio — no
    await between the ``locked()`` check and the uncontended acquire."""
    lock = _workflow_slots.setdefault(name, asyncio.Lock())
    if lock.locked():
        yield False
        return
    async with lock:
        yield True


async def gather_bounded(coros: Iterable[Awaitable[T]]) -> list[T]:
    """Run awaitables with cross-company parallelism capped by :data:`MAX_COMPANY_PARALLELISM`.
    Order of results matches input order."""

    async def _guarded(coro: Awaitable[T]) -> T:
        async with company_gate():
            return await coro

    return await asyncio.gather(*(_guarded(c) for c in coros))
