"""Hermetic test for the ``recall_preferences`` tool — no Postgres, no network.

The tool embeds the query (here a stub) and projects the ranked corpus rows into ``UserInterestHit``
DTOs, turning cosine distance into similarity (1 - distance). The fake session ignores the built
statement and just hands back rows, so this exercises projection without a database.
"""

from __future__ import annotations

from types import SimpleNamespace

from app.tools.research import recall_preferences


class _FakeEmbeddings:
    async def embed_query(self, text: str):
        return SimpleNamespace(vector=[0.0] * 8, model="voyage-3")


class _Result:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return list(self._rows)


class _FakeSession:
    def __init__(self, rows):
        self._rows = rows

    async def execute(self, stmt):
        return _Result(self._rows)


async def test_recall_projects_rows_and_computes_similarity() -> None:
    rows = [
        (SimpleNamespace(kind="declared", text="Tracks the Energy sector."), 0.2),
        (SimpleNamespace(kind="question", text="What's happening with NVDA?"), 0.5),
    ]
    hits = await recall_preferences(
        _FakeSession(rows), _FakeEmbeddings(), query_text="oil prices", k=5
    )

    assert [h.kind for h in hits] == ["declared", "question"]
    assert hits[0].text == "Tracks the Energy sector."
    assert abs(hits[0].similarity - 0.8) < 1e-9  # 1 - distance
    assert abs(hits[1].similarity - 0.5) < 1e-9


async def test_recall_empty_corpus_returns_nothing() -> None:
    hits = await recall_preferences(_FakeSession([]), _FakeEmbeddings(), query_text="anything")
    assert hits == []
