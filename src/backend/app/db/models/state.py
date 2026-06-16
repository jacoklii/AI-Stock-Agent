"""Research state — agent working memory across sessions.

One row per research session. The agent reconstructs its context window from this row
on resume: topic, what it's currently doing, what it's already done (tasks JSONB),
findings so far, open questions, and sources consulted. Nothing else is pulled in.

State is flushed to the DB when the agent finishes a task (not mid-task). On close,
findings are promoted to ``analysis`` rows. Autonomous workflows promote automatically;
user-initiated sessions ask first.

``parent_state_id`` supports hierarchical research: a deep dive spawned from a broader
session links back to it. The rolling summary embedding enables semantic search across
past and current research state — "find sessions where I explored X before."
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, PydanticJSONB, TimestampMixin, embedding_vector, intpk
from app.db.enums import StateStatus, state_status_enum
from app.db.payloads import StateProgress, StateSources, StateTaskList


class ResearchState(Base, TimestampMixin):
    __tablename__ = "research_state"
    __table_args__ = (
        Index("ix_research_state_status_active", "status", "last_active_at"),
        Index(
            "ix_research_state_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    id: Mapped[intpk]
    topic: Mapped[str] = mapped_column(Text)
    status: Mapped[StateStatus] = mapped_column(
        state_status_enum,
        default=StateStatus.open,
        server_default=StateStatus.open.value,
        index=True,
    )
    # Who opened this session: "user" (requested from the interface) or "schedule" (the agent's own
    # autonomous/scheduled work). Lets the UI distinguish requested vs autonomous research.
    initiated_by: Mapped[str] = mapped_column(
        String(16), default="schedule", server_default="schedule"
    )
    # What the agent is doing right now (null when idle / between tasks).
    current_task: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Live heartbeat of the running agent loop (phase, iteration, tool/source/token counters),
    # overwritten every turn so the UI can show progress instead of a frozen row. Null until the
    # session's first beat; stale once closed.
    progress: Mapped[StateProgress | None] = mapped_column(
        PydanticJSONB(StateProgress), nullable=True
    )
    # Previous and finished tasks within this session (in-session task list).
    tasks: Mapped[StateTaskList | None] = mapped_column(PydanticJSONB(StateTaskList), nullable=True)
    findings: Mapped[str | None] = mapped_column(Text, nullable=True)
    open_questions: Mapped[str | None] = mapped_column(Text, nullable=True)
    sources: Mapped[StateSources | None] = mapped_column(PydanticJSONB(StateSources), nullable=True)

    opened_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_active_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Self-referential: deep-dive sessions link back to their parent.
    parent_state_id: Mapped[int | None] = mapped_column(
        ForeignKey("research_state.id", ondelete="SET NULL"), index=True, nullable=True
    )

    # Rolling summary embedding for semantic search across sessions.
    embedding: Mapped[list[float] | None] = mapped_column(embedding_vector(), nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(64), nullable=True)
