"""run_job ledger + with_retry behaviour (against the migrated Postgres)."""

from __future__ import annotations

import pytest
from sqlalchemy import select

from app.db.enums import JobStatus
from app.db.models.jobs import Job
from app.db.session import SessionLocal
from app.workflows.runtime import run_job, with_retry


async def test_run_job_records_success():
    async with run_job("test_success", params={"k": "v"}) as handle:
        handle.count("processed", 3)
        handle.message("all good")
        job_id = handle.id

    async with SessionLocal() as session:
        job = (await session.execute(select(Job).where(Job.id == job_id))).scalar_one()
        assert job.status is JobStatus.succeeded
        assert job.started_at is not None and job.completed_at is not None
        assert job.result_summary is not None
        assert job.result_summary.counts == {"processed": 3}
        assert job.result_summary.message == "all good"
        await session.delete(job)
        await session.commit()


async def test_run_job_records_failure_and_reraises():
    job_id: int | None = None
    with pytest.raises(RuntimeError, match="boom"):
        async with run_job("test_failure") as handle:
            job_id = handle.id
            raise RuntimeError("boom")

    assert job_id is not None
    async with SessionLocal() as session:
        job = (await session.execute(select(Job).where(Job.id == job_id))).scalar_one()
        assert job.status is JobStatus.failed
        assert job.error_message is not None and "boom" in job.error_message
        assert job.completed_at is not None
        await session.delete(job)
        await session.commit()


async def test_with_retry_succeeds_after_transient_failures():
    calls = {"n": 0}

    async def flaky() -> str:
        calls["n"] += 1
        if calls["n"] < 3:
            raise ValueError("transient")
        return "ok"

    result = await with_retry(flaky, attempts=3, base_delay=0.0)
    assert result == "ok"
    assert calls["n"] == 3


async def test_with_retry_reraises_after_exhaustion():
    async def always_fails() -> None:
        raise ValueError("permanent")

    with pytest.raises(ValueError, match="permanent"):
        await with_retry(always_fails, attempts=2, base_delay=0.0)
