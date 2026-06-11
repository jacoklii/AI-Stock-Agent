"""Hermetic tests for the significance recheck — no Postgres, no LLM.

Covers the pure move computation and the wakeup symmetry: an event promoted to or above the
wakeup significance calls the researcher back, a sub-threshold promotion does not.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from types import SimpleNamespace

from app.workflows import deep_research, significance_recheck
from app.workflows.runtime import TaskHandle


def _price(close: float | None) -> SimpleNamespace:
    return SimpleNamespace(close=close)


def test_move_pct_clear_move() -> None:
    move = significance_recheck._move_pct([_price(100.0), _price(110.0)])
    assert move is not None and round(move, 2) == 9.09


def test_move_pct_needs_two_closes() -> None:
    assert significance_recheck._move_pct([_price(100.0)]) is None
    assert significance_recheck._move_pct([_price(100.0), _price(None)]) is None


def test_move_pct_zero_last_close() -> None:
    assert significance_recheck._move_pct([_price(100.0), _price(0.0)]) is None


class _FakeWriteSession:
    """Write-path stand-in: the promotions UPDATE finds no rows, commit is a no-op."""

    async def __aenter__(self) -> "_FakeWriteSession":
        return self

    async def __aexit__(self, *exc: object) -> bool:
        return False

    async def execute(self, *args: object) -> SimpleNamespace:
        return SimpleNamespace(scalars=lambda: iter([]))

    async def commit(self) -> None:
        pass


@asynccontextmanager
async def _fake_run_task(*args, **kwargs):
    yield TaskHandle(id=1)


def _patch_seams(monkeypatch, *, significance: float) -> dict:
    """One stored event with a clear subsequent price move -> deterministic +0.25 boost."""
    recorded = {"wakeups": 0}

    @asynccontextmanager
    async def _fake_ro_session():
        yield None

    async def _events(session, **kwargs):
        return [
            SimpleNamespace(news_event_id=1, company_id=5, significance=significance, url="u")
        ]

    async def _prices(session, *, company_id, limit):
        return [_price(100.0), _price(110.0)]  # 9.09% move >= 5.0 threshold

    async def _wakeup():
        recorded["wakeups"] += 1
        return {"skipped": True}

    monkeypatch.setattr(significance_recheck, "readonly_session", _fake_ro_session)
    monkeypatch.setattr(significance_recheck, "get_news_events", _events)
    monkeypatch.setattr(significance_recheck, "get_price_history", _prices)
    monkeypatch.setattr(significance_recheck, "SessionLocal", _FakeWriteSession)
    monkeypatch.setattr(significance_recheck, "run_task", _fake_run_task)
    monkeypatch.setattr(deep_research, "run_autonomous", _wakeup)
    return recorded


async def test_promotion_over_wakeup_bar_calls_researcher_back(monkeypatch) -> None:
    # 0.5 + 0.25 boost = 0.75 >= 0.7 wakeup significance.
    recorded = _patch_seams(monkeypatch, significance=0.5)
    await significance_recheck.run()
    assert recorded["wakeups"] == 1


async def test_promotion_under_wakeup_bar_rests(monkeypatch) -> None:
    # 0.2 + 0.25 boost = 0.45 < 0.7 wakeup significance.
    recorded = _patch_seams(monkeypatch, significance=0.2)
    await significance_recheck.run()
    assert recorded["wakeups"] == 0
