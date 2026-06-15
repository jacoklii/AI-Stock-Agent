"""Hermetic tests for the industry indexer — no Postgres, no network.

Contract: it embeds ``"{name}: {description}"`` (name-only when there's no description) for each
active industry missing an embedding, writes the embedding + model, and a mid-run embedding failure
stops gracefully leaving committed progress.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from types import SimpleNamespace

from app.workflows.research import industry_index as ix


class _Result:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return list(self._rows)


class _ROSession:
    def __init__(self, rows):
        self._rows = rows

    async def execute(self, stmt):
        return _Result(self._rows)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False


class _FakeEmbeddings:
    def __init__(self, fail_after: int | None = None):
        self.calls = 0
        self._fail_after = fail_after

    async def embed_query(self, text: str):
        self.calls += 1
        if self._fail_after is not None and self.calls > self._fail_after:
            raise RuntimeError("rate limited")
        return SimpleNamespace(vector=[float(self.calls)] * 4, model="voyage-3")


class _WriteSession:
    """Captures the Industry rows mutated across commits via ``get``."""

    def __init__(self, store):
        self.store = store

    async def get(self, model, pk):
        return self.store[pk]

    async def commit(self):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False


async def test_pending_renders_name_and_description(monkeypatch) -> None:
    session = _ROSession([(1, "Semiconductors", "Chips."), (2, "Energy", None)])

    @asynccontextmanager
    async def _ro():
        yield session

    monkeypatch.setattr(ix, "readonly_session", _ro)

    pending = await ix._pending()

    assert pending == [(1, "Semiconductors: Chips."), (2, "Energy")]  # name-only when no description


async def test_run_embeds_and_writes_each_pending_industry(monkeypatch) -> None:
    store = {10: SimpleNamespace(embedding=None, embedding_model=None)}

    async def _pending():
        return [(10, "Semiconductors: Chips.")]

    monkeypatch.setattr(ix, "_pending", _pending)
    monkeypatch.setattr(ix, "get_embeddings_provider", lambda: _FakeEmbeddings())
    monkeypatch.setattr(ix, "SessionLocal", lambda: _WriteSession(store))

    result = await ix.run()

    assert result == {"indexed": 1}
    assert store[10].embedding == [1.0, 1.0, 1.0, 1.0]
    assert store[10].embedding_model == "voyage-3"


async def test_run_stops_gracefully_on_embedding_failure(monkeypatch) -> None:
    store = {
        1: SimpleNamespace(embedding=None, embedding_model=None),
        2: SimpleNamespace(embedding=None, embedding_model=None),
    }

    async def _pending():
        return [(1, "a"), (2, "b")]

    monkeypatch.setattr(ix, "_pending", _pending)
    monkeypatch.setattr(ix, "get_embeddings_provider", lambda: _FakeEmbeddings(fail_after=1))
    monkeypatch.setattr(ix, "SessionLocal", lambda: _WriteSession(store))

    result = await ix.run()

    assert result == {"indexed": 1}  # first committed, second failed → stop
    assert store[1].embedding is not None
    assert store[2].embedding is None
