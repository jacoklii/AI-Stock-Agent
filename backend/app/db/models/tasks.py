"""Task audit trail (cross-cutting observer).

Every workflow step writes here — breadth ingest jobs, scoring runs, digest/brief
assembly, and deep research tasks. ``state_id`` is nullable: ingest and scheduling
tasks have no research session; deep research tasks link back to their ``research_state``
row. ``tokens_used`` is the cost record that feeds the weekly budget.

Failures are visible and re-runnable — no silent partial successes. Queryable fields
are columns; task-type-specific inputs/outputs live in the typed JSONB ``params`` /
``result_summary``.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, PydanticJSONB, TimestampMixin, intpk
from app.db.enums import TaskStatus, task_status_enum
from app.db.payloads import TaskParams, TaskResult, TokenUsage


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id: Mapped[intpk]
    # Nullable: breadth/ingest tasks have no session; deep research tasks do.
    state_id: Mapped[int | None] = mapped_column(
        ForeignKey("research_state.id", ondelete="SET NULL"), index=True, nullable=True
    )
    type: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[TaskStatus] = mapped_column(
        task_status_enum, default=TaskStatus.pending, server_default=TaskStatus.pending.value, index=True
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Where a failure started: "external" (a provider/dependency error) vs "internal" (our bug).
    # Null on success. Lets the UI and operators tell an upstream outage from a code fault.
    error_kind: Mapped[str | None] = mapped_column(String(16), nullable=True)
    params: Mapped[TaskParams | None] = mapped_column(PydanticJSONB(TaskParams), nullable=True)
    result_summary: Mapped[TaskResult | None] = mapped_column(PydanticJSONB(TaskResult), nullable=True)
    # Blended cost-weighted spend (feeds the budget); the raw input/output/cache breakdown + web
    # tool uses live alongside it in ``token_usage`` for measurement.
    tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    token_usage: Mapped[TokenUsage | None] = mapped_column(PydanticJSONB(TokenUsage), nullable=True)
