"""Hermetic test for ``search_similar_by_vector`` — no Postgres, no network.

The shared vector-ranking core behind the semantic searches and the read-only "related" surfaces.
It takes an existing vector (no embed), ranks an embedded surface closest-first, and projects each
hit to ``(orm_row, similarity)`` with similarity = 1 - cosine distance. The fake session ignores the
built statement and hands rows back, so this exercises projection without a database.
"""

from __future__ import annotations

from types import SimpleNamespace

from app.db.models.news import NewsEvent
from app.tools.research import search_similar_by_vector


class _Result:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return list(self._rows)


class _FakeSession:
    def __init__(self, rows):
        self._rows = rows
        self.last_stmt = None

    async def execute(self, stmt):
        self.last_stmt = stmt  # captured so the test can assert it built without error
        return _Result(self._rows)


async def test_projects_rows_and_turns_distance_into_similarity() -> None:
    rows = [
        (SimpleNamespace(id=1, headline="a"), 0.1),
        (SimpleNamespace(id=2, headline="b"), 0.25),
    ]
    session = _FakeSession(rows)

    hits = await search_similar_by_vector(
        session, NewsEvent, vector=[0.0, 1.0], model_name="voyage-3", k=5
    )

    assert [(row.id, round(sim, 2)) for row, sim in hits] == [(1, 0.9), (2, 0.75)]
    assert session.last_stmt is not None  # the cosine/exclude statement built cleanly


async def test_exclude_id_is_accepted_and_empty_surface_returns_nothing() -> None:
    session = _FakeSession([])
    hits = await search_similar_by_vector(
        session, NewsEvent, vector=[0.0], model_name="voyage-3", exclude_id=7
    )
    assert hits == []
