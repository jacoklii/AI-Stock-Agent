"""Deep-analysis read tools: scores (dense) and prose (sparse) for deep-coverage companies.

Scoped to deep coverage by design — scores and prose only exist for watchlist companies
so these tools simply return what's there (empty for an out-of-scope company; that's
the cost boundary surfacing, not an error). Prose travels with its source provenance.

Fundamental and sentimental are now stored in separate tables (``fundamental``,
``sentimental``), each combining scores + prose in one row.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import AnalysisType
from app.db.models.analysis import Analysis, Fundamental, Sentimental
from app.tools.registry import (
    TASK_COMPANY_PROSE,
    TASK_DEEP_RESEARCH,
    TASK_FOLLOWUP,
    TASK_SECTION_SNAPSHOT,
    TASK_TOP_SNAPSHOT,
    tool,
)
from app.tools.tool_schema import AnalysisRow, LatestScores, ProseRow, ScoreRow, SourceRef

_MODEL_MAP = {"fundamental": Fundamental, "sentimental": Sentimental}


def _to_score_row(row: object) -> ScoreRow:
    scores = row.scores.root if row.scores is not None else None  # type: ignore[attr-defined]
    return ScoreRow(
        score=row.score,  # type: ignore[attr-defined]
        scores=scores,
        rubric_version=row.rubric_version,  # type: ignore[attr-defined]
        model_name=row.model_name,  # type: ignore[attr-defined]
        generated_at=row.generated_at,  # type: ignore[attr-defined]
        data_through=row.data_through,  # type: ignore[attr-defined]
    )


async def _latest(session: AsyncSession, company_id: int, kind: str) -> object | None:
    model = _MODEL_MAP[kind]
    stmt = (
        select(model)
        .where(model.company_id == company_id)
        .order_by(model.generated_at.desc())
        .limit(1)
    )
    return (await session.execute(stmt)).scalar_one_or_none()


@tool(
    name="get_latest_scores",
    description="Newest fundamental + sentimental score for a deep-coverage company.",
    tasks={TASK_COMPANY_PROSE, TASK_SECTION_SNAPSHOT, TASK_TOP_SNAPSHOT, TASK_FOLLOWUP, TASK_DEEP_RESEARCH},
    output_model=LatestScores,
)
async def get_latest_scores(session: AsyncSession, *, company_id: int) -> LatestScores:
    f = await _latest(session, company_id, "fundamental")
    s = await _latest(session, company_id, "sentimental")
    return LatestScores(
        company_id=company_id,
        fundamental=_to_score_row(f) if f is not None else None,
        sentimental=_to_score_row(s) if s is not None else None,
    )


@tool(
    name="get_score_history",
    description="Historical score trajectory on one axis (fundamental|sentimental), newest first.",
    tasks={TASK_COMPANY_PROSE, TASK_FOLLOWUP, TASK_DEEP_RESEARCH},
    output_model=ScoreRow,
)
async def get_score_history(
    session: AsyncSession,
    *,
    company_id: int,
    kind: str,
    since: datetime | None = None,
    limit: int = 100,
) -> list[ScoreRow]:
    if kind not in _MODEL_MAP:
        raise ValueError(f"kind must be one of {list(_MODEL_MAP)}")
    model = _MODEL_MAP[kind]
    stmt = select(model).where(model.company_id == company_id)
    if since is not None:
        stmt = stmt.where(model.generated_at >= since)
    stmt = stmt.order_by(model.generated_at.desc()).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    return [_to_score_row(r) for r in rows]


@tool(
    name="get_latest_prose",
    description="Newest prose row on one axis (fundamental|sentimental), with supporting sources.",
    tasks={TASK_COMPANY_PROSE, TASK_SECTION_SNAPSHOT, TASK_TOP_SNAPSHOT, TASK_FOLLOWUP, TASK_DEEP_RESEARCH},
    output_model=ProseRow,
)
async def get_latest_prose(
    session: AsyncSession,
    *,
    company_id: int,
    kind: str,
) -> ProseRow | None:
    """Sparse by design — returns ``None`` when the AI has no current read to show."""
    if kind not in _MODEL_MAP:
        raise ValueError(f"kind must be one of {list(_MODEL_MAP)}")
    row = await _latest(session, company_id, kind)
    if row is None or row.prose is None:  # type: ignore[union-attr]
        return None

    # supporting_inputs carries the source provenance (replaces the old citations table)
    si = row.supporting_inputs  # type: ignore[union-attr]
    sources: list[SourceRef] = []
    if si is not None:
        for nid in (si.news_event_ids or []):
            sources.append(SourceRef(news_event_id=nid, source_ref=None))
        for ref in (si.source_refs or []):
            sources.append(SourceRef(news_event_id=None, source_ref=ref))

    return ProseRow(
        prose_id=row.id,  # type: ignore[union-attr]
        body=row.prose,  # type: ignore[union-attr]
        model_name=row.model_name,  # type: ignore[union-attr]
        generated_at=row.generated_at,  # type: ignore[union-attr]
        data_through=row.data_through,  # type: ignore[union-attr]
        sources=sources,
    )


@tool(
    name="get_latest_analysis",
    description="Recent rows from the type-tagged analysis table (sector/industry/macro/summary).",
    tasks={TASK_SECTION_SNAPSHOT, TASK_TOP_SNAPSHOT, TASK_FOLLOWUP, TASK_DEEP_RESEARCH},
    output_model=AnalysisRow,
)
async def get_latest_analysis(
    session: AsyncSession,
    *,
    type: str | None = None,
    limit: int = 10,
) -> list[AnalysisRow]:
    """Read the broader ``analysis`` outputs, newest first. ``type`` filters to one of
    fundamental|sentimental|event_driven|summary; omit it for the latest across all types."""
    stmt = select(Analysis)
    if type is not None:
        stmt = stmt.where(Analysis.type == AnalysisType(type))
    stmt = stmt.order_by(Analysis.generated_at.desc()).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        AnalysisRow(
            analysis_id=r.id,
            type=r.type.value,
            generated_at=r.generated_at,
            content=r.content.model_dump() if r.content is not None else None,
            news_event_ids=list(r.supporting_inputs.news_event_ids) if r.supporting_inputs else [],
            model_name=r.model_name,
        )
        for r in rows
    ]
