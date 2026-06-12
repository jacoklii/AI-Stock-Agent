"""Hermetic tests for the followup workflow — the chat's lightweight Q&A path.

The contract: an exhausted weekly budget short-circuits with a canned answer (no LLM call, no
task row); a normal run passes the remaining budget as the ceiling and records the spend on the
task handle.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from types import SimpleNamespace

from app.agents.researcher.schemas import FollowupOut
from app.workflows.research import followup
from app.workflows.runtime import TaskHandle


@asynccontextmanager
async def _fake_ro_session():
    yield None


def _patch_budget(monkeypatch, remaining: int | None) -> None:
    async def _remaining(session):
        return remaining

    monkeypatch.setattr(followup, "readonly_session", _fake_ro_session)
    monkeypatch.setattr(followup, "remaining_weekly_budget", _remaining)


async def test_exhausted_budget_short_circuits(monkeypatch) -> None:
    _patch_budget(monkeypatch, remaining=0)

    def _no_researcher():
        raise AssertionError("LLM must not be called when the budget is exhausted")

    entered = []

    @asynccontextmanager
    async def _no_task(*args, **kwargs):
        entered.append(True)
        yield TaskHandle(id=1)

    monkeypatch.setattr(followup, "get_researcher", _no_researcher)
    monkeypatch.setattr(followup, "run_task", _no_task)

    out = await followup.run(query="anything")
    assert "budget" in out.answer.lower()
    assert out.sources == []
    assert entered == []  # no task row for a declined run


async def test_records_spend_and_passes_ceiling(monkeypatch) -> None:
    _patch_budget(monkeypatch, remaining=5_000)
    holder: dict = {}

    @asynccontextmanager
    async def _fake_run_task(*args, **kwargs):
        holder["handle"] = TaskHandle(id=1)
        yield holder["handle"]

    async def _researcher_task(task, *, inputs, budget=None):
        assert budget is not None and budget.ceiling == 5_000
        budget.add(123)
        return FollowupOut(answer="grounded answer", sources=[4])

    monkeypatch.setattr(followup, "run_task", _fake_run_task)
    monkeypatch.setattr(
        followup, "get_researcher", lambda: SimpleNamespace(run_task=_researcher_task)
    )

    out = await followup.run(query="what moved gold?", company_id=2)
    assert out.answer == "grounded answer"
    assert holder["handle"].tokens == 123
