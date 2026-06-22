"""Hermetic tests for the general/macro news lane of ``_fetch_events`` — no network.

The contract: the general feed always flows (even with an empty watchlist — breadth watches
the whole market); the per-symbol depth fetch stays watchlist-only; tickers on a general item
resolve ``company_id`` against every active tier, and archived companies are invisible.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from app.db.enums import CoverageTier
from app.providers.news import RawNewsItem
from app.tools.tool_schema import ScreenCandidate
from app.workflows.research import news_ingest

_NOW = datetime(2026, 6, 11, 12, 0, tzinfo=timezone.utc)


def _candidate(company_id: int, ticker: str, tier: CoverageTier) -> ScreenCandidate:
    return ScreenCandidate(
        company_id=company_id,
        ticker=ticker,
        name=ticker,
        sector=None,
        industry_id=None,
        coverage_tier=tier,
    )


def _item(url: str, tickers: list[str]) -> RawNewsItem:
    return RawNewsItem(url=url, headline=f"h {url}", published_at=_NOW, tickers=tickers)


class _FakeProvider:
    def __init__(self, general: list[RawNewsItem], company: list[RawNewsItem]):
        self._general = general
        self._company = company
        self.company_calls: list[list[str]] = []

    async def fetch_general_news(self, *, since=None):
        return self._general

    async def fetch_events(self, symbols, *, since=None):
        self.company_calls.append(list(symbols))
        return self._company


def _patch(monkeypatch, *, candidates, provider) -> None:
    @asynccontextmanager
    async def _ro():
        yield None

    async def _screen(session, *, filters):
        return candidates

    class _NoWeb:
        async def fetch(self, *, since=None):
            return []

    monkeypatch.setattr(news_ingest, "readonly_session", _ro)
    monkeypatch.setattr(news_ingest, "screen_stocks", _screen)
    monkeypatch.setattr(news_ingest, "get_news_provider", lambda: provider)
    monkeypatch.setattr(news_ingest, "get_web_news_provider", lambda: _NoWeb())


async def test_general_feed_flows_without_a_watchlist(monkeypatch) -> None:
    provider = _FakeProvider(
        general=[_item("https://a", ["NVDA"]), _item("https://b", [])],
        company=[],
    )
    _patch(
        monkeypatch,
        candidates=[_candidate(7, "NVDA", CoverageTier.discovered)],
        provider=provider,
    )

    events = await news_ingest._fetch_events()

    assert [e.url for e in events] == ["https://a", "https://b"]
    assert events[0].company_id == 7  # discovered tier still resolves
    assert events[1].company_id is None  # pure macro item
    assert provider.company_calls == []  # no watchlist -> no per-symbol spend


async def test_depth_fetch_stays_watchlist_only(monkeypatch) -> None:
    provider = _FakeProvider(
        general=[_item("https://macro", [])],
        company=[_item("https://aapl", ["AAPL"])],
    )
    _patch(
        monkeypatch,
        candidates=[
            _candidate(1, "AAPL", CoverageTier.watchlist),
            _candidate(2, "NVDA", CoverageTier.discovered),
        ],
        provider=provider,
    )

    events = await news_ingest._fetch_events()

    assert provider.company_calls == [["AAPL"]]
    assert {e.url for e in events} == {"https://macro", "https://aapl"}


async def test_archived_companies_are_invisible(monkeypatch) -> None:
    provider = _FakeProvider(general=[_item("https://x", ["OLDCO"])], company=[])
    _patch(
        monkeypatch,
        candidates=[_candidate(9, "OLDCO", CoverageTier.archived)],
        provider=provider,
    )

    events = await news_ingest._fetch_events()

    assert events[0].company_id is None  # archived: excluded from all active coverage
    assert provider.company_calls == []
