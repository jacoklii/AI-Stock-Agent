"""Embeddings provider wrapper (Voyage).

The single file an embedding-provider swap would touch. The model is FIXED
(``settings.embedding_model`` = ``voyage-3``, 1024-dim) and its name is returned alongside
every vector, so a future change is a detectable, explicit backfill — never silent. The
Voyage client is synchronous, so calls are dispatched to a worker thread.

Only ``embed_query`` is exposed here — the read-only tools embed a *query string* to search
stored summaries/prose. Bulk document embedding at ingest is a separate (write-path) concern
that lands with the ingest workflow.
"""

from __future__ import annotations

import asyncio

from pydantic import BaseModel

from app.config import get_settings


class EmbeddingResult(BaseModel):
    """A vector plus the model that produced it (stored/compared, never assumed)."""

    vector: list[float]
    model: str


class EmbeddingsProvider:
    """Stable surface over Voyage, bound to the fixed configured model."""

    def __init__(self) -> None:
        settings = get_settings()
        self._model = settings.embedding_model
        self._api_key = settings.voyage_api_key

    def _embed(self, text: str) -> list[float]:
        """Blocking single-query embed. Runs in a worker thread."""
        import voyageai

        client = voyageai.Client(api_key=self._api_key)
        result = client.embed([text], model=self._model, input_type="query")
        return list(result.embeddings[0])

    async def embed_query(self, text: str) -> EmbeddingResult:
        """Embed a search query. The returned ``model`` must match the ``embedding_model``
        stored on the rows being searched, or the comparison is meaningless."""
        vector = await asyncio.to_thread(self._embed, text)
        return EmbeddingResult(vector=vector, model=self._model)


def get_embeddings_provider() -> EmbeddingsProvider:
    return EmbeddingsProvider()
