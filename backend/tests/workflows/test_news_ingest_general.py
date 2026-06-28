"""Hermetic tests for ``_fetch_events`` against Alpha Vantage — no network.

The contract: the breadth feed always flows (even with an empty watchlist — breadth watches the
whole market); a ticker named in an article resolves ``company_id`` against every active tier;
archived companies are invisible; and the optional ticker-depth call fires only when
``ALPHAVANTAGE_FETCH_TICKER_DEPTH`` is enabled, watchlist-only.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from app.db.enums import CoverageTier
from app.providers.alpha_vantage_news import RawNewsItem
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
    def __init__(self, breadth: list[RawNewsItem], depth: list[RawNewsItem]):
        self._breadth = breadth
        self._depth = depth
        self.depth_calls: list[list[str]] = []

    async def fetch_breadth(self, *, since=None):
        return self._breadth

    async def fetch_for_tickers(self, symbols, *, since=None):
        self.depth_calls.append(list(symbols))
        return self._depth


def _patch(monkeypatch, *, candidates, provider) -> None:
    @asynccontextmanager
    async def _ro():
        yield None

    async def _screen(session, *, filters):
        return candidates

    monkeypatch.setattr(news_ingest, "readonly_session", _ro)
    monkeypatch.setattr(news_ingest, "screen_stocks", _screen)
    monkeypatch.setattr(news_ingest, "get_news_provider", lambda: provider)


async def test_breadth_flows_without_a_watchlist(monkeypatch) -> None:
    provider = _FakeProvider(
        breadth=[_item("https://a", ["NVDA"]), _item("https://b", [])],
        depth=[],
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
    assert provider.depth_calls == []  # depth gated off by default


async def test_ticker_depth_is_gated_and_watchlist_only(monkeypatch) -> None:
    provider = _FakeProvider(
        breadth=[_item("https://macro", [])],
        depth=[_item("https://aapl", ["AAPL"])],
    )
    _patch(
        monkeypatch,
        candidates=[
            _candidate(1, "AAPL", CoverageTier.watchlist),
            _candidate(2, "NVDA", CoverageTier.discovered),
        ],
        provider=provider,
    )
    monkeypatch.setattr(news_ingest, "ALPHAVANTAGE_FETCH_TICKER_DEPTH", True)

    events = await news_ingest._fetch_events()

    assert provider.depth_calls == [["AAPL"]]  # only the watchlisted ticker
    assert {e.url for e in events} == {"https://macro", "https://aapl"}


async def test_archived_companies_are_invisible(monkeypatch) -> None:
    provider = _FakeProvider(breadth=[_item("https://x", ["OLDCO"])], depth=[])
    _patch(
        monkeypatch,
        candidates=[_candidate(9, "OLDCO", CoverageTier.archived)],
        provider=provider,
    )

    events = await news_ingest._fetch_events()

    assert events[0].company_id is None  # archived: excluded from all active coverage
    assert provider.depth_calls == []
