"""Interest indexer — keeps the user-interest corpus embedded and current.

The background (non-LLM, embeddings-only) half of the "learn what's valuable to this user"
mechanism. It assembles short interest "lines" from the user's own data and embeds each so the
``recall_preferences`` tool can retrieve the relevant slice on demand:

- **declared** — the sectors they track, the industries they flag critical, the stocks in their brief.
- **question** — the questions they ask in chat.
- **topic** — the research topics they open (autonomous self-directed sessions excluded — those are
  the agent's choices, not the user's).

Idempotent: ``source_ref`` is a unique key, so a line already in the corpus is skipped before any
embedding spend. Embedding is per-line and committed as it goes, so a partial run (e.g. the Voyage
free-tier rate limit trips mid-batch) still makes progress and the next run resumes from where it
stopped. ``run`` never writes anything but the corpus, and never calls an LLM.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy import select

from app.db.enums import ChatRole
from app.db.models.chat import ChatMessage
from app.db.models.companies import Industry
from app.db.models.state import ResearchState
from app.db.models.user import UserPreferences
from app.db.models.user_interest import UserInterest
from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import get_embeddings_provider

logger = logging.getLogger(__name__)

# How many recent rows of each user-activity source to consider per run. The corpus is small and
# slow-moving; the cap just bounds work and keeps embedding spend predictable.
_CHAT_LIMIT = 200
_TOPIC_LIMIT = 100


@dataclass(frozen=True)
class _Line:
    source_ref: str  # unique idempotency key
    kind: str  # declared | question | topic
    text: str


async def _candidate_lines() -> list[_Line]:
    """Render the user's data into interest lines. Read-only; produces every candidate, indexing
    decides which are new."""
    # Lazy import keeps the autonomous-session sentinel DRY without paying deep_research's heavy
    # import graph at module load (this module is imported at API boot).
    from app.workflows.research.deep_research import _AUTONOMOUS_QUERY

    lines: list[_Line] = []
    async with readonly_session() as session:
        prefs = (
            await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
        ).scalar_one_or_none()
        if prefs is not None:
            for sector in prefs.interested_sectors:
                lines.append(_Line(f"sector:{sector}", "declared", f"Tracks the {sector} sector."))
            for ticker in prefs.brief_user:
                lines.append(_Line(f"stock:{ticker}", "declared", f"Follows {ticker} in the brief."))
            if prefs.critical_industries:
                names = (
                    await session.execute(
                        select(Industry.id, Industry.name).where(
                            Industry.id.in_(prefs.critical_industries)
                        )
                    )
                ).all()
                for ind_id, name in names:
                    lines.append(
                        _Line(f"industry:{ind_id}", "declared", f"Flags {name} as a critical industry.")
                    )

        questions = (
            await session.execute(
                select(ChatMessage.id, ChatMessage.content)
                .where(ChatMessage.role == ChatRole.user)
                .order_by(ChatMessage.id.desc())
                .limit(_CHAT_LIMIT)
            )
        ).all()
        for cid, content in questions:
            if content and content.strip():
                lines.append(_Line(f"chat:{cid}", "question", content.strip()))

        topics = (
            await session.execute(
                select(ResearchState.id, ResearchState.topic)
                .order_by(ResearchState.id.desc())
                .limit(_TOPIC_LIMIT)
            )
        ).all()
        for sid, topic in topics:
            if topic and topic.strip() and topic != _AUTONOMOUS_QUERY:
                lines.append(_Line(f"state:{sid}", "topic", topic.strip()))
    return lines


async def _existing_refs(refs: list[str]) -> set[str]:
    if not refs:
        return set()
    async with readonly_session() as session:
        rows = await session.execute(
            select(UserInterest.source_ref).where(UserInterest.source_ref.in_(refs))
        )
        return set(rows.scalars())


async def run() -> dict[str, int]:
    """Embed and insert every interest line not already in the corpus. Idempotent and embeddings-
    only. Returns ``{"indexed": n, "skipped": m}``; a mid-run embedding failure stops gracefully and
    leaves what succeeded committed for the next run to extend."""
    candidates = await _candidate_lines()
    known = await _existing_refs([c.source_ref for c in candidates])
    pending = [c for c in candidates if c.source_ref not in known]

    embeddings = get_embeddings_provider()
    indexed = 0
    for line in pending:
        try:
            embedded = await embeddings.embed_query(line.text)
        except Exception:
            # Best-effort (e.g. embeddings rate limit): stop here, keep what's committed, resume
            # next run. Idempotency makes the retry safe.
            logger.warning("interest index stopped early after %d line(s)", indexed, exc_info=True)
            break
        async with SessionLocal() as session:
            session.add(
                UserInterest(
                    kind=line.kind,
                    text=line.text,
                    source_ref=line.source_ref,
                    embedding=embedded.vector,
                    embedding_model=embedded.model,
                )
            )
            await session.commit()
        indexed += 1

    return {"indexed": indexed, "skipped": len(candidates) - len(pending)}
