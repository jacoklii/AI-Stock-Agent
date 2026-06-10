"""Workflow runtime — task-run tracking, the "failures are visible and re-runnable" stop.

Every workflow runs inside ``run_task``. It writes a ``tasks`` row at the start (``running``),
commits it so an in-flight run is observable, and on exit records the terminal state:
``succeeded`` with a ``result_summary``, or ``failed`` with the exception text — then re-raises
so the caller still sees the failure. There are no silent partial successes; a run either has a
terminal ``tasks`` row or is visibly stuck in ``running`` for re-run.

This is the runtime the pipelines run *under*; the pipeline modules themselves are deferred.
The task ledger is a *write* path, so ``run_task`` owns its own writable session (distinct from
the read-only sessions tools use). Workflow bodies open whatever sessions they need.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import TypeVar

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.enums import TaskStatus
from app.db.models.tasks import Task
from app.db.payloads import TaskParams, TaskResult
from app.db.session import SessionLocal

T = TypeVar("T")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class TaskHandle:
    """Live handle to the running ``tasks`` row. The workflow records outcome counts/message on
    ``result``; ``run_task`` persists it as ``result_summary`` on success."""

    id: int
    result: TaskResult = field(default_factory=TaskResult)
    # Tokens spent by the work in this task; persisted to ``tasks.tokens_used`` (feeds the budget).
    tokens: int = 0

    def count(self, name: str, n: int = 1) -> None:
        self.result.counts[name] = self.result.counts.get(name, 0) + n

    def message(self, text: str) -> None:
        self.result.message = text


# Back-compat alias — callers using JobHandle will still work.
JobHandle = TaskHandle


@asynccontextmanager
async def run_task(
    task_type: str,
    *,
    params: TaskParams | dict | None = None,
    state_id: int | None = None,
    session_factory: async_sessionmaker[AsyncSession] = SessionLocal,
) -> AsyncIterator[TaskHandle]:
    """Wrap a unit of work in a tracked ``tasks`` row. Yields a :class:`TaskHandle`."""
    async with session_factory() as session:
        task = Task(
            type=task_type,
            status=TaskStatus.running,
            started_at=_utcnow(),
            params=params,
            state_id=state_id,
        )
        session.add(task)
        await session.flush()
        handle = TaskHandle(id=task.id)
        await session.commit()

        try:
            yield handle
        except Exception as exc:
            task.status = TaskStatus.failed
            task.error_message = f"{type(exc).__name__}: {exc}"
            task.tokens_used = handle.tokens or None  # a failed run still spent tokens
            task.completed_at = _utcnow()
            await session.commit()
            raise
        else:
            task.status = TaskStatus.succeeded
            task.result_summary = handle.result
            task.tokens_used = handle.tokens or None
            task.completed_at = _utcnow()
            await session.commit()


# Back-compat alias so existing callers using ``run_job`` continue to work.
run_job = run_task


async def with_retry(
    fn: Callable[[], Awaitable[T]],
    *,
    attempts: int = 3,
    base_delay: float = 0.5,
    retry_on: tuple[type[BaseException], ...] = (Exception,),
) -> T:
    """Run ``fn`` with bounded exponential backoff. Re-raises the last error after the final
    attempt, so a workflow still fails cleanly when retries are exhausted."""
    if attempts < 1:
        raise ValueError("attempts must be >= 1")
    last: BaseException | None = None
    for attempt in range(1, attempts + 1):
        try:
            return await fn()
        except retry_on as exc:
            last = exc
            if attempt == attempts:
                break
            await asyncio.sleep(base_delay * 2 ** (attempt - 1))
    assert last is not None
    raise last
