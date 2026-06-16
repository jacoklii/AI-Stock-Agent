"""Hermetic test for ``deep_research._recall`` graceful degradation — no Postgres, no embeddings.

Recall seeding is best-effort: when the embeddings search raises a ``ProviderError`` (rate limit,
upstream blip), ``_recall`` returns an empty seed flagged ``recall_degraded`` instead of crashing
before the agent even runs. The seams are monkeypatched at module level, mirroring the existing
deep-research tests.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from app.providers.errors import ProviderUnavailable
from app.workflows.research import deep_research


async def test_recall_degrades_to_empty_seed_on_provider_error(monkeypatch) -> None:
    @asynccontextmanager
    async def _fake_ro_session():
        yield None

    async def _raise(*args, **kwargs):
        raise ProviderUnavailable("voyage embed failed", provider="voyage")

    monkeypatch.setattr(deep_research, "readonly_session", _fake_ro_session)
    monkeypatch.setattr(deep_research, "get_embeddings_provider", lambda: None)
    monkeypatch.setattr(deep_research, "search_similar", _raise)

    result = await deep_research._recall("q")  # must not raise

    assert result == {
        "known_analysis": [],
        "related_sessions": [],
        "recall_degraded": True,
    }
