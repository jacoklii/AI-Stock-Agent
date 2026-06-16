"""Embeddings provider wrapper (Voyage).

The single file an embedding-provider swap would touch. The model is FIXED
(``settings.embedding_model`` = ``voyage-3``, 1024-dim) and its name is returned alongside
every vector, so a future change is a detectable, explicit backfill — never silent. The
Voyage client is synchronous, so calls are dispatched to a worker thread.

Only ``embed_query`` is exposed here — the read-only tools embed a *query string* to search
stored summaries/prose. Bulk document embedding at ingest is a separate (write-path) concern
that lands with the ingest workflow.

**Rate-limit containment.** Voyage's free tier is a few requests/minute, and three callers share
it: the boot indexers, the agent's recall/semantic tools, and the close-embedding. A single
**process-wide async limiter** (``_RateLimiter``) paces *every* embed call to ``voyage_max_rpm``,
so they self-serialize instead of collectively tripping the wall and bleeding the agent's tokens.
A call that does hit a rate limit or upstream blip is retried with backoff (``with_retry``); when
retries are exhausted it surfaces as a typed :class:`ProviderError` (``RateLimited`` /
``ProviderUnavailable``) so the caller can tell an external stall from an internal bug.
"""

from __future__ import annotations

import asyncio
import time

from pydantic import BaseModel

from app.config import get_settings
from app.providers.errors import ProviderUnavailable, RateLimited


class EmbeddingResult(BaseModel):
    """A vector plus the model that produced it (stored/compared, never assumed)."""

    vector: list[float]
    model: str


class _RateLimiter:
    """Process-wide min-interval limiter: at most ``rpm`` calls per rolling minute, enforced by
    spacing acquisitions ``60/rpm`` seconds apart. Async-safe via an internal lock — concurrent
    callers queue rather than burst. Shared across every embed call in the process."""

    def __init__(self, rpm: int) -> None:
        self._min_interval = 60.0 / rpm if rpm > 0 else 0.0
        self._lock = asyncio.Lock()
        self._next_at = 0.0

    async def acquire(self) -> None:
        if self._min_interval <= 0:
            return
        async with self._lock:
            now = time.monotonic()
            wait = self._next_at - now
            if wait > 0:
                await asyncio.sleep(wait)
                now = time.monotonic()
            self._next_at = now + self._min_interval


# One limiter for the whole process — module-level so it's shared regardless of how many
# EmbeddingsProvider instances are created (``get_embeddings_provider`` returns a fresh one).
_LIMITER = _RateLimiter(get_settings().voyage_max_rpm)


def _is_rate_limit(exc: BaseException) -> bool:
    """Best-effort detection of a Voyage rate-limit error without importing its exception types
    (the SDK surface varies). Matches the class name or the 429/quota wording in the message."""
    name = type(exc).__name__.lower()
    if "ratelimit" in name:
        return True
    text = str(exc).lower()
    return "rate limit" in text or "429" in text or "too many requests" in text


class EmbeddingsProvider:
    """Stable surface over Voyage, bound to the fixed configured model."""

    def __init__(self) -> None:
        settings = get_settings()
        self._model = settings.embedding_model
        self._api_key = settings.voyage_api_key
        self._timeout = settings.embed_timeout_s
        self._attempts = settings.embed_retry_attempts

    def _embed(self, text: str) -> list[float]:
        """Blocking single-query embed. Runs in a worker thread."""
        import voyageai

        client = voyageai.Client(api_key=self._api_key)
        result = client.embed([text], model=self._model, input_type="query")
        return list(result.embeddings[0])

    async def embed_query(self, text: str) -> EmbeddingResult:
        """Embed a search query. The returned ``model`` must match the ``embedding_model``
        stored on the rows being searched, or the comparison is meaningless.

        Paced by the shared limiter and retried with backoff; a persistent failure raises a typed
        :class:`ProviderError` so callers can contain it as *external*."""
        # Local import to avoid a circular import (workflows -> providers -> workflows).
        from app.workflows.runtime import with_retry

        async def _call() -> list[float]:
            await _LIMITER.acquire()
            try:
                return await asyncio.wait_for(
                    asyncio.to_thread(self._embed, text), timeout=self._timeout
                )
            except asyncio.TimeoutError as exc:
                raise ProviderUnavailable(
                    f"voyage embed timed out after {self._timeout}s", provider="voyage"
                ) from exc

        try:
            vector = await with_retry(_call, attempts=self._attempts)
        except ProviderUnavailable:
            raise
        except Exception as exc:  # noqa: BLE001 — classify, then re-raise as a typed ProviderError
            if _is_rate_limit(exc):
                raise RateLimited(f"voyage rate limit: {exc}", provider="voyage") from exc
            raise ProviderUnavailable(f"voyage embed failed: {exc}", provider="voyage") from exc
        return EmbeddingResult(vector=vector, model=self._model)


def get_embeddings_provider() -> EmbeddingsProvider:
    return EmbeddingsProvider()
