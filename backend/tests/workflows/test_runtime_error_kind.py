"""Hermetic tests for ``run_task`` failure attribution — no Postgres.

``run_task`` writes a ``tasks`` row, and on an exception records *where* the failure started:
``error_kind="external"`` for a typed ``ProviderError`` (an upstream dependency), ``"internal"``
for anything else (our own bug). Either way it marks the row ``failed`` and re-raises. A fake
sessionmaker stands in for the DB: ``add`` applies the PK a real flush would, ``commit`` is a
no-op, and the test inspects the captured ``Task`` ORM object after the context exits.
"""

from __future__ import annotations

import pytest

from app.db.enums import TaskStatus
from app.providers.errors import ProviderUnavailable
from app.workflows import runtime


class _FakeSession:
    """Async-context-manager session that captures added rows and counts commits."""

    def __init__(self, store: dict) -> None:
        self._store = store
        self._next_id = 1

    async def __aenter__(self) -> "_FakeSession":
        return self

    async def __aexit__(self, *exc: object) -> bool:
        return False  # never swallow — run_task must re-raise the body's exception

    def add(self, obj) -> None:
        if getattr(obj, "id", None) is None:
            obj.id = self._next_id
            self._next_id += 1
        self._store["task"] = obj

    async def flush(self) -> None:
        pass

    async def commit(self) -> None:
        self._store["commits"] = self._store.get("commits", 0) + 1


def _sessionmaker(store: dict):
    def _make() -> _FakeSession:
        return _FakeSession(store)

    return _make


async def test_provider_error_is_recorded_as_external(monkeypatch) -> None:
    store: dict = {}
    with pytest.raises(ProviderUnavailable):
        async with runtime.run_task("deep_research", session_factory=_sessionmaker(store)):
            raise ProviderUnavailable("voyage down", provider="voyage")

    task = store["task"]
    assert task.status == TaskStatus.failed
    assert task.error_kind == "external"
    assert task.error_message == "ProviderUnavailable: voyage down"
    assert task.completed_at is not None


async def test_plain_exception_is_recorded_as_internal(monkeypatch) -> None:
    store: dict = {}
    with pytest.raises(ValueError):
        async with runtime.run_task("deep_research", session_factory=_sessionmaker(store)):
            raise ValueError("logic bug")

    task = store["task"]
    assert task.status == TaskStatus.failed
    assert task.error_kind == "internal"
    assert task.error_message == "ValueError: logic bug"


async def test_token_usage_breakdown_is_persisted() -> None:
    """The raw input/output/cache + web breakdown set on the handle lands on ``tasks.token_usage``
    alongside the blended ``tokens_used`` — on a successful run."""
    from app.db.payloads import TokenUsage

    store: dict = {}
    async with runtime.run_task("deep_research", session_factory=_sessionmaker(store)) as handle:
        handle.tokens = 2360
        handle.usage = TokenUsage(
            input=100, output=10, cache_write=1000, cache_read=10_000,
            web_tool_uses={"web_search": 2},
        )

    task = store["task"]
    assert task.status == TaskStatus.succeeded
    assert task.tokens_used == 2360
    assert task.token_usage.input == 100
    assert task.token_usage.output == 10
    assert task.token_usage.web_tool_uses == {"web_search": 2}
