"""Hermetic tests for the embeddings provider's rate-limit + retry containment — no network.

``embed_query`` paces every call through the shared ``_LIMITER`` and retries the blocking embed
with backoff; once retries are exhausted the failure surfaces as a *typed* ``ProviderError`` so the
caller can contain it as external. These exercise that classification (rate-limit -> ``RateLimited``,
anything else -> ``ProviderUnavailable``) and that the retry actually ran ``attempts`` times — with
the limiter interval and retry backoff shrunk to ~0 so nothing actually sleeps seconds.
"""

from __future__ import annotations

import asyncio

import pytest

from app.providers import embeddings as emb
from app.providers.errors import ProviderUnavailable, RateLimited


@pytest.fixture(autouse=True)
def _fast_seams(monkeypatch):
    """Make the limiter and retry backoff effectively free so tests don't sleep."""
    # Process-wide limiter: zero the interval so acquire() returns immediately.
    monkeypatch.setattr(emb._LIMITER, "_min_interval", 0.0)
    monkeypatch.setattr(emb._LIMITER, "_next_at", 0.0)

    # with_retry is imported inside embed_query from app.workflows.runtime; shrink its backoff
    # so exhausting retries is instant. asyncio.sleep is the only thing it waits on.
    real_sleep = asyncio.sleep

    async def _no_sleep(_seconds):
        await real_sleep(0)

    monkeypatch.setattr(emb.asyncio, "sleep", _no_sleep)


def _make_provider(monkeypatch, *, embed, attempts: int = 3):
    """A provider whose blocking ``_embed`` is replaced by ``embed`` (sync callable)."""
    provider = emb.EmbeddingsProvider()
    provider._attempts = attempts
    monkeypatch.setattr(emb.EmbeddingsProvider, "_embed", lambda self, text: embed(text))
    return provider


async def test_rate_limit_shaped_failure_raises_RateLimited_after_attempts(monkeypatch) -> None:
    calls = {"n": 0}

    def _always_rate_limited(_text):
        calls["n"] += 1
        raise RuntimeError("429 Too Many Requests")

    provider = _make_provider(monkeypatch, embed=_always_rate_limited, attempts=3)
    with pytest.raises(RateLimited) as ei:
        await provider.embed_query("q")
    assert ei.value.provider == "voyage"
    assert ei.value.transient is True
    assert calls["n"] == 3  # retried exactly `attempts` times


async def test_generic_failure_raises_ProviderUnavailable_after_attempts(monkeypatch) -> None:
    calls = {"n": 0}

    def _always_boom(_text):
        calls["n"] += 1
        raise RuntimeError("connection reset by peer")

    provider = _make_provider(monkeypatch, embed=_always_boom, attempts=4)
    with pytest.raises(ProviderUnavailable) as ei:
        await provider.embed_query("q")
    assert ei.value.provider == "voyage"
    assert ei.value.transient is True
    assert calls["n"] == 4


async def test_limiter_serializes_concurrent_acquires(monkeypatch) -> None:
    """Concurrent acquires self-serialize: each one pushes ``_next_at`` forward by the interval and
    the followers sleep the residual rather than bursting. Asserted on the limiter's own scheduling
    state and recorded sleeps so it stays deterministic (no wall-clock flakiness)."""
    # This limiter is independent of the autouse no-op-sleep seam; capture the sleeps it requests.
    limiter = emb._RateLimiter(rpm=60)  # 1.0s nominal interval
    limiter._min_interval = 1.0

    # Fake monotonic clock that only advances when the limiter "sleeps" — so the spacing math is
    # exact and deterministic, with no real waiting.
    clock = {"t": 100.0}
    slept: list[float] = []

    async def _record_sleep(seconds):
        slept.append(seconds)
        clock["t"] += seconds  # the sleep is what advances time

    monkeypatch.setattr(emb.asyncio, "sleep", _record_sleep)
    monkeypatch.setattr(emb.time, "monotonic", lambda: clock["t"])

    await asyncio.gather(limiter.acquire(), limiter.acquire(), limiter.acquire())

    # First acquire is immediate; each follower waits exactly one interval behind the lock.
    assert slept == [1.0, 1.0]
    # _next_at advanced by three intervals total — the burst was serialized, not collapsed.
    assert limiter._next_at == 103.0
