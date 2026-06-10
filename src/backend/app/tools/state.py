"""Research-state tools — the agent's working memory across a deep-research session.

``research_state`` is the durable scratchpad a session resumes from: topic, current task,
findings so far, open questions, and sources consulted. These tools are the *specific write
path* the architecture allows the AI ("writes only through specific paths"): ``open_research``
creates a session row, ``update_research`` flushes progress when the agent finishes a task
(append-only on findings/questions; sources accumulate), and ``close_research`` ends it.
``get_research_state`` is the read half used to reconstruct context on resume.

Promotion of findings into ``analysis`` on close is the deep-research *workflow's* job, not these
tools' — so the agent never writes the durable analysis record directly.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import StateStatus
from app.db.models.state import ResearchState
from app.db.payloads import StateSources
from app.providers.embeddings import EmbeddingsProvider
from app.tools.registry import TASK_DEEP_RESEARCH, tool
from app.tools.tool_schema import ResearchStateResult


def _result(row: ResearchState) -> ResearchStateResult:
    sources = row.sources or StateSources()
    return ResearchStateResult(
        state_id=row.id,
        topic=row.topic,
        status=row.status.value,
        current_task=row.current_task,
        findings=row.findings,
        open_questions=row.open_questions,
        source_ids=list(sources.source_ids),
        source_urls=list(sources.urls),
    )


def _append(existing: str | None, addition: str | None) -> str | None:
    if not addition:
        return existing
    return f"{existing}\n{addition}" if existing else addition


@tool(
    name="open_research",
    description="Open a research-state session row and return its id.",
    tasks={TASK_DEEP_RESEARCH},
    output_model=ResearchStateResult,
    writes=True,
)
async def open_research(
    session: AsyncSession, *, topic: str, parent_state_id: int | None = None
) -> ResearchStateResult:
    row = ResearchState(topic=topic, status=StateStatus.open, parent_state_id=parent_state_id)
    session.add(row)
    await session.commit()
    return _result(row)


@tool(
    name="update_research",
    description="Flush progress to a research session: current task, new findings/questions, sources.",
    tasks={TASK_DEEP_RESEARCH},
    output_model=ResearchStateResult,
    writes=True,
)
async def update_research(
    session: AsyncSession,
    *,
    state_id: int,
    current_task: str | None = None,
    findings: str | None = None,
    open_questions: str | None = None,
    source_ids: list[int] | None = None,
    source_urls: list[str] | None = None,
) -> ResearchStateResult | None:
    """Append-only on findings/open-questions; sources accumulate (de-duplicated)."""
    row = (await session.execute(select(ResearchState).where(ResearchState.id == state_id))).scalar_one_or_none()
    if row is None:
        return None
    if current_task is not None:
        row.current_task = current_task
    row.findings = _append(row.findings, findings)
    row.open_questions = _append(row.open_questions, open_questions)
    if source_ids or source_urls:
        sources = row.sources or StateSources()
        merged_ids = list(dict.fromkeys([*sources.source_ids, *(source_ids or [])]))
        merged_urls = list(dict.fromkeys([*sources.urls, *(source_urls or [])]))
        row.sources = StateSources(source_ids=merged_ids, urls=merged_urls)
    await session.commit()
    return _result(row)


@tool(
    name="close_research",
    description="Close a research session (status=closed). Findings promotion is the workflow's job.",
    tasks={TASK_DEEP_RESEARCH},
    output_model=ResearchStateResult,
    writes=True,
)
async def close_research(
    session: AsyncSession, embeddings_provider: EmbeddingsProvider, *, state_id: int
) -> ResearchStateResult | None:
    """Close the session and embed its findings into ``state.embedding`` so the closed session is
    semantically retrievable by future research (rolling long-term memory)."""
    row = (await session.execute(select(ResearchState).where(ResearchState.id == state_id))).scalar_one_or_none()
    if row is None:
        return None
    row.status = StateStatus.closed
    row.current_task = None
    row.closed_at = datetime.now(timezone.utc)
    if row.findings:
        embedded = await embeddings_provider.embed_query(row.findings)
        row.embedding = embedded.vector
        row.embedding_model = embedded.model
    await session.commit()
    return _result(row)


@tool(
    name="get_research_state",
    description="Read one research-state session by id (for resuming context).",
    tasks={TASK_DEEP_RESEARCH},
    output_model=ResearchStateResult,
)
async def get_research_state(session: AsyncSession, *, state_id: int) -> ResearchStateResult | None:
    row = (await session.execute(select(ResearchState).where(ResearchState.id == state_id))).scalar_one_or_none()
    return _result(row) if row is not None else None
