"""Industry indexer — keeps the industry vocabulary embedded so orphan macro news can be routed.

The background (non-LLM, embeddings-only) half of the "give macro news an industry home" mechanism.
It embeds ``"{name}: {description}"`` for each active industry that doesn't yet have an embedding, so
``news_ingest`` can route a company-less event to its closest industry by cosine — no LLM classifier.

Idempotent: an industry that already has an embedding is skipped before any embedding spend. Embedding
is per-row and committed as it goes, so a partial run (e.g. the Voyage free-tier rate limit trips
mid-batch) still makes progress and the next run resumes. ``run`` writes nothing but the industry
embedding columns, and never calls an LLM. Mirrors ``interest_index``.
"""

from __future__ import annotations

import logging

from sqlalchemy import select

from app.db.models.companies import Industry
from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import get_embeddings_provider

logger = logging.getLogger(__name__)


async def _pending() -> list[tuple[int, str]]:
    """Active industries missing an embedding, as (id, text-to-embed). Read-only."""
    async with readonly_session() as session:
        rows = (
            await session.execute(
                select(Industry.id, Industry.name, Industry.description).where(
                    Industry.is_active.is_(True), Industry.embedding.is_(None)
                )
            )
        ).all()
    pending: list[tuple[int, str]] = []
    for ind_id, name, description in rows:
        text = f"{name}: {description}" if description else name
        pending.append((ind_id, text))
    return pending


async def run() -> dict[str, int]:
    """Embed every active industry not already embedded. Idempotent and embeddings-only. Returns
    ``{"indexed": n}``; a mid-run embedding failure stops gracefully and leaves what succeeded
    committed for the next run to extend."""
    pending = await _pending()

    embeddings = get_embeddings_provider()
    indexed = 0
    for ind_id, text in pending:
        try:
            embedded = await embeddings.embed_query(text)
        except Exception:
            # Best-effort (e.g. embeddings rate limit): stop, keep what's committed, resume next run.
            logger.warning("industry index stopped early after %d row(s)", indexed, exc_info=True)
            break
        async with SessionLocal() as session:
            industry = await session.get(Industry, ind_id)
            if industry is None:
                continue
            industry.embedding = embedded.vector
            industry.embedding_model = embedded.model
            await session.commit()
        indexed += 1

    return {"indexed": indexed}
