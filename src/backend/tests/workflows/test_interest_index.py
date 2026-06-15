"""Hermetic tests for the interest indexer — no Postgres, no network.

Contract: the indexer renders the user's data into interest lines, embeds only the lines not
already in the corpus (idempotency by ``source_ref``), and a mid-run embedding failure stops
gracefully leaving committed progress. Autonomous self-directed sessions are excluded from the
``topic`` lines — those are the agent's choices, not the user's.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from types import SimpleNamespace

from app.workflows.research import interest_index as ix


class _Result:
    def __init__(self, *, scalar=None, rows=None):
        self._scalar = scalar
        self._rows = rows or []

    def scalar_one_or_none(self):
        return self._scalar

    def all(self):
        return list(self._rows)


class _QueueSession:
    """Queue-driven AsyncSession stand-in: each execute pops the next result."""

    def __init__(self, results):
        self.results = list(results)
        self.added = []

    async def execute(self, stmt):
        return self.results.pop(0)

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        pass

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
        return SimpleNamespace(vector=[0.0] * 8, model="voyage-3")


def _lines() -> list[ix._Line]:
    return [
        ix._Line("sector:Energy", "declared", "Tracks the Energy sector."),
        ix._Line("chat:1", "question", "What's happening with oil?"),
    ]


def _patch_run(monkeypatch, *, existing, embeddings, sink):
    async def _cands():
        return _lines()

    async def _existing(refs):
        return set(existing)

    monkeypatch.setattr(ix, "_candidate_lines", _cands)
    monkeypatch.setattr(ix, "_existing_refs", _existing)
    monkeypatch.setattr(ix, "get_embeddings_provider", lambda: embeddings)
    monkeypatch.setattr(ix, "SessionLocal", lambda: sink)


class _Sink:
    """A single reusable fake session that records every added row across commits."""

    def __init__(self):
        self.added = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        pass


async def test_empty_corpus_indexes_every_line(monkeypatch) -> None:
    sink = _Sink()
    _patch_run(monkeypatch, existing=set(), embeddings=_FakeEmbeddings(), sink=sink)

    result = await ix.run()

    assert result == {"indexed": 2, "skipped": 0}
    assert {o.source_ref for o in sink.added} == {"sector:Energy", "chat:1"}


async def test_known_lines_are_skipped(monkeypatch) -> None:
    sink = _Sink()
    _patch_run(
        monkeypatch, existing={"sector:Energy", "chat:1"}, embeddings=_FakeEmbeddings(), sink=sink
    )

    result = await ix.run()

    assert result == {"indexed": 0, "skipped": 2}
    assert sink.added == []


async def test_embedding_failure_stops_gracefully(monkeypatch) -> None:
    sink = _Sink()
    _patch_run(monkeypatch, existing=set(), embeddings=_FakeEmbeddings(fail_after=1), sink=sink)

    result = await ix.run()

    assert result["indexed"] == 1  # first line committed, second failed → stop
    assert len(sink.added) == 1


async def test_candidate_lines_render_and_exclude_autonomous(monkeypatch) -> None:
    # The real autonomous sentinel is planted as a topic row to assert it's excluded.
    from app.workflows.research.deep_research import _AUTONOMOUS_QUERY

    prefs = SimpleNamespace(
        interested_sectors=["Energy"], brief_user=["NVDA"], critical_industries=[]
    )
    session = _QueueSession(
        [
            _Result(scalar=prefs),  # UserPreferences singleton
            _Result(rows=[(1, "What about oil?")]),  # chat questions (role=user)
            _Result(rows=[(5, "EV supply chain"), (6, _AUTONOMOUS_QUERY)]),  # research topics
        ]
    )

    @asynccontextmanager
    async def _ro():
        yield session

    monkeypatch.setattr(ix, "readonly_session", _ro)

    lines = await ix._candidate_lines()
    refs = {ln.source_ref for ln in lines}

    assert refs == {"sector:Energy", "stock:NVDA", "chat:1", "state:5"}  # state:6 (autonomous) gone
    energy = next(ln for ln in lines if ln.source_ref == "sector:Energy")
    assert energy.kind == "declared"
