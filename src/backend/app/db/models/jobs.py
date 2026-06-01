"""Job / run state (cross-cutting observer).

Every workflow writes here; failures are visible and re-runnable (no silent partial
successes). Queryable fields are columns; job-type-specific inputs/outputs live in the
typed JSONB ``params`` / ``result_summary``.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, PydanticJSONB, TimestampMixin, intpk
from app.db.enums import JobStatus, job_status_enum
from app.db.payloads import JobParams, JobResult


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    id: Mapped[intpk]
    job_type: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[JobStatus] = mapped_column(
        job_status_enum, default=JobStatus.pending, server_default=JobStatus.pending.value, index=True
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    params: Mapped[JobParams | None] = mapped_column(PydanticJSONB(JobParams), nullable=True)
    result_summary: Mapped[JobResult | None] = mapped_column(PydanticJSONB(JobResult), nullable=True)
