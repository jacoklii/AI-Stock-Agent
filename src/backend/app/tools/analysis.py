"""Deep-analysis read tools: scores (dense) and prose (sparse) + citations.

Scoped to deep coverage by design — scores and prose only exist for watchlist + flagged-sector
companies, so these tools simply return what's there (empty for an out-of-scope company; that's
the cost boundary surfacing, not an error). Prose always travels with its citations: an AI
read is never served without the sources that fed it.

``kind`` selects the analytical dimension (fundamental vs sentimental). It reuses ``ProseKind``
as the shared vocabulary for that axis across both the score and prose tables.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import ProseKind
from app.db.models.analysis import (
    Citation,
    FundamentalProse,
    FundamentalScore,
    SentimentalProse,
    SentimentalScore,
)
from app.tools.registry import (
    TASK_COMPANY_PROSE,
    TASK_FOLLOWUP,
    TASK_SECTION_SNAPSHOT,
    TASK_TOP_SNAPSHOT,
    tool,
)
from app.tools.tool_schema import CitationRef, LatestScores, ProseRow, ScoreRow

_SCORE_MODEL = {ProseKind.fundamental: FundamentalScore, ProseKind.sentimental: SentimentalScore}
_PROSE_MODEL = {ProseKind.fundamental: FundamentalProse, ProseKind.sentimental: SentimentalProse}


# --- Helpers ------------------------------------------------------------------


def _to_score_row(kind: ProseKind, row: object) -> ScoreRow:
    components = row.components.root if row.components is not None else None  # type: ignore[attr-defined]
    return ScoreRow(
        kind=kind,
        score=row.score,  # type: ignore[attr-defined]
        components=components,
        rubric_version=row.rubric_version,  # type: ignore[attr-defined]
        model_name=row.model_name,  # type: ignore[attr-defined]
        generated_at=row.generated_at,  # type: ignore[attr-defined]
        data_through=row.data_through,  # type: ignore[attr-defined]
    )


async def _latest_score(session: AsyncSession, company_id: int, kind: ProseKind) -> ScoreRow | None:
    model = _SCORE_MODEL[kind]
    stmt = (
        select(model)
        .where(model.company_id == company_id)
        .order_by(model.generated_at.desc())
        .limit(1)
    )
    row = (await session.execute(stmt)).scalar_one_or_none()
    return _to_score_row(kind, row) if row is not None else None


# --- Tools --------------------------------------------------------------------


@tool(
    name="get_latest_scores",
    description="Newest fundamental + sentimental score for a deep-coverage company.",
    tasks={TASK_COMPANY_PROSE, TASK_SECTION_SNAPSHOT, TASK_TOP_SNAPSHOT, TASK_FOLLOWUP},
    output_model=LatestScores,
)
async def get_latest_scores(session: AsyncSession, *, company_id: int) -> LatestScores:
    return LatestScores(
        company_id=company_id,
        fundamental=await _latest_score(session, company_id, ProseKind.fundamental),
        sentimental=await _latest_score(session, company_id, ProseKind.sentimental),
    )


@tool(
    name="get_score_history",
    description="Historical score trajectory on one axis, newest first.",
    tasks={TASK_COMPANY_PROSE, TASK_FOLLOWUP},
    output_model=ScoreRow,
)
async def get_score_history(
    session: AsyncSession,
    *,
    company_id: int,
    kind: ProseKind,
    since: datetime | None = None,
    limit: int = 100,
) -> list[ScoreRow]:
    model = _SCORE_MODEL[kind]
    stmt = select(model).where(model.company_id == company_id)
    if since is not None:
        stmt = stmt.where(model.generated_at >= since)
    stmt = stmt.order_by(model.generated_at.desc()).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    return [_to_score_row(kind, r) for r in rows]


@tool(
    name="get_latest_prose",
    description="Newest prose row on one axis, with the citations that fed it.",
    tasks={TASK_COMPANY_PROSE, TASK_SECTION_SNAPSHOT, TASK_TOP_SNAPSHOT, TASK_FOLLOWUP},
    output_model=ProseRow,
)
async def get_latest_prose(
    session: AsyncSession,
    *,
    company_id: int,
    kind: ProseKind,
) -> ProseRow | None:
    """Sparse by design — returns ``None`` when the AI has no current read to show. The
    sources are loaded in the same call so prose is never served without its provenance."""
    model = _PROSE_MODEL[kind]
    stmt = (
        select(model)
        .where(model.company_id == company_id)
        .order_by(model.generated_at.desc())
        .limit(1)
    )
    prose = (await session.execute(stmt)).scalar_one_or_none()
    if prose is None:
        return None

    cite_stmt = select(Citation).where(
        Citation.prose_kind == kind, Citation.prose_id == prose.id
    )
    cites = (await session.execute(cite_stmt)).scalars().all()
    return ProseRow(
        prose_id=prose.id,
        kind=kind,
        body=prose.body,
        model_name=prose.model_name,
        generated_at=prose.generated_at,
        data_through=prose.data_through,
        citations=[CitationRef(news_event_id=c.news_event_id, source_ref=c.source_ref) for c in cites],
    )
