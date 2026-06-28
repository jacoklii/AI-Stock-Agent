"""Home / detailed-digest mirror.

Per ARCHITECTURE.md the digest is NOT persisted as its own table — it is reconstructed from the
most recent ``analysis`` row of ``type=summary`` (the top snapshot + section snapshots the digest
workflow writes). "No digest yet" is an expected state, not an error, so it answers 200/null —
a 404 would log a console error on every Home load.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session
from app.api.schemas import DigestSectionOut, DigestView
from app.db.enums import AnalysisType
from app.db.models.analysis import Analysis

router = APIRouter(tags=["home"])


@router.get("/digest/latest", response_model=DigestView | None)
async def latest_digest(session: AsyncSession = Depends(ro_session)) -> DigestView | None:
    # ``type=summary`` also covers promoted research findings (topic/findings shape) — only
    # rows carrying the digest shape (top_snapshot/sections) are a digest. Scan recent rows.
    rows = (
        await session.execute(
            select(Analysis)
            .where(Analysis.type == AnalysisType.summary)
            .order_by(Analysis.generated_at.desc())
            .limit(20)
        )
    ).scalars()
    row = next(
        (
            r
            for r in rows
            if r.content is not None
            and not {"top_snapshot", "sections"}.isdisjoint(r.content.model_dump())
        ),
        None,
    )
    if row is None:
        return None

    # content is an open JSONB shape (keys defined by the digest prompt) — read defensively.
    content = row.content.model_dump()
    sections = [
        DigestSectionOut(
            section_title=s.get("section_title", ""),
            snapshot=s.get("snapshot", ""),
            article_refs=list(s.get("article_refs", [])),
            key_tickers=list(s.get("key_tickers", [])),
        )
        for s in content.get("sections", [])
    ]
    source_event_ids = (
        list(row.supporting_inputs.news_event_ids) if row.supporting_inputs is not None else []
    )
    return DigestView(
        id=row.id,
        generated_at=row.generated_at,
        top_snapshot=content.get("top_snapshot"),
        sections=sections,
        source_event_ids=source_event_ids,
    )
