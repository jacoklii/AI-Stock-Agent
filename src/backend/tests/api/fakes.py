"""Shared fakes for hermetic API-route tests — no Postgres.

Routes get their sessions via the ``ro_session`` / ``rw_session`` dependencies, so tests
override those with a :class:`FakeSession` pre-loaded with the results each ``execute`` should
return (in call order). ORM instances are plain Python objects until attached to a real session,
so tests build them directly; ``FakeSession.add`` stands in for the PK/timestamp defaults a real
flush would apply.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.api import deps
from app.main import app


class FakeScalars:
    def __init__(self, items: list) -> None:
        self._items = list(items)

    def __iter__(self):
        return iter(self._items)

    def all(self) -> list:
        return list(self._items)


class FakeResult:
    """One ``execute`` result. Configure whichever accessor the route uses."""

    def __init__(self, *, scalars: list | None = None, scalar: object = None) -> None:
        self._scalars = scalars or []
        self._scalar = scalar

    def scalars(self) -> FakeScalars:
        return FakeScalars(self._scalars)

    def scalar_one_or_none(self) -> object:
        return self._scalar

    def scalar_one(self) -> object:
        return self._scalar

    def first(self) -> object:
        return self._scalar


class FakeSession:
    """Queue-driven stand-in for ``AsyncSession``: each ``execute`` pops the next result."""

    def __init__(self, results: list[FakeResult] | None = None) -> None:
        self.results = list(results or [])
        self.added: list = []
        self.commits = 0
        self._next_id = 1

    async def execute(self, stmt) -> FakeResult:
        if not self.results:
            raise AssertionError(f"unexpected execute: {stmt}")
        return self.results.pop(0)

    def add(self, obj) -> None:
        # Stand in for the DB defaults a real flush applies.
        if getattr(obj, "id", None) is None:
            obj.id = self._next_id
            self._next_id += 1
        if getattr(obj, "created_at", None) is None:
            obj.created_at = datetime.now(timezone.utc)
        self.added.append(obj)

    async def commit(self) -> None:
        self.commits += 1

    async def flush(self) -> None:
        pass


def use_session(fake: FakeSession) -> None:
    """Route both session dependencies at ``fake`` for the current test."""

    async def _dep():
        yield fake

    app.dependency_overrides[deps.ro_session] = _dep
    app.dependency_overrides[deps.rw_session] = _dep
