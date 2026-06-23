"""Hermetic tests for the yFinance financials/prices parsing — a fake ``yfinance`` module is
injected into ``sys.modules`` so no network call happens. Real pandas frames exercise the actual
parsing semantics (Timestamp -> date, NaN -> None, label fallbacks, point-in-time attach)."""

from __future__ import annotations

import sys
from datetime import date
from types import SimpleNamespace

import pandas as pd

from app.providers import market


def _install_fake_yfinance(monkeypatch, *, ticker_obj) -> None:
    fake = SimpleNamespace(Ticker=lambda symbol: ticker_obj)
    monkeypatch.setitem(sys.modules, "yfinance", fake)


def test_read_financials_parses_periods_and_attaches_snapshot(monkeypatch) -> None:
    cols = [pd.Timestamp("2023-12-31"), pd.Timestamp("2022-12-31")]
    income = pd.DataFrame(
        {
            cols[0]: {"Total Revenue": 100.0, "EBITDA": 40.0, "Net Income": 25.0, "Diluted EPS": 1.5},
            cols[1]: {"Total Revenue": 80.0, "EBITDA": 30.0, "Net Income": 20.0, "Diluted EPS": 1.2},
        }
    )
    cash = pd.DataFrame({cols[0]: {"Capital Expenditure": -10.0}, cols[1]: {"Capital Expenditure": -8.0}})
    ticker = SimpleNamespace(
        info={"marketCap": 5_000.0, "trailingPE": 22.5, "currentPrice": 150.0, "trailingEps": None},
        income_stmt=income,
        cashflow=cash,
        quarterly_income_stmt=None,
        quarterly_cashflow=None,
    )
    _install_fake_yfinance(monkeypatch, ticker_obj=ticker)

    out = market._read_financials("AAPL")

    assert {s.period_end for s in out} == {date(2023, 12, 31), date(2022, 12, 31)}
    latest = next(s for s in out if s.period_end == date(2023, 12, 31))
    assert latest.revenue == 100.0 and latest.ebitda == 40.0 and latest.capex == -10.0
    # Point-in-time snapshot lands on the most recent period only.
    assert latest.market_cap == 5_000.0 and latest.pe == 22.5 and latest.price == 150.0
    older = next(s for s in out if s.period_end == date(2022, 12, 31))
    assert older.market_cap is None and older.pe is None


def test_read_financials_nan_becomes_none_and_label_fallback(monkeypatch) -> None:
    col = pd.Timestamp("2023-12-31")
    # No "EBITDA" row, only the normalized variant; Net Income via the fallback label; EPS is NaN.
    income = pd.DataFrame(
        {col: {"Total Revenue": 100.0, "Normalized EBITDA": 41.0, "Net Income Common Stockholders": 9.0, "Diluted EPS": float("nan")}}
    )
    ticker = SimpleNamespace(
        info={}, income_stmt=income, cashflow=None, quarterly_income_stmt=None, quarterly_cashflow=None
    )
    _install_fake_yfinance(monkeypatch, ticker_obj=ticker)

    out = market._read_financials("X")
    assert len(out) == 1
    s = out[0]
    assert s.ebitda == 41.0  # fell back to the normalized label
    assert s.net_income == 9.0  # fell back to the common-stockholders label
    assert s.eps is None  # NaN normalized to None
    assert s.capex is None  # no cashflow frame


def test_read_financials_resilient_to_provider_error(monkeypatch) -> None:
    class Boom:
        @property
        def info(self):  # noqa: D401 - simulate a yfinance fetch blowing up
            raise RuntimeError("network down")

    _install_fake_yfinance(monkeypatch, ticker_obj=Boom())
    assert market._read_financials("BAD") == []


def test_read_prices_parses_bars(monkeypatch) -> None:
    idx = pd.DatetimeIndex([pd.Timestamp("2024-01-02"), pd.Timestamp("2024-01-03")])
    hist = pd.DataFrame(
        {
            "Open": [10.0, 11.0],
            "High": [12.0, 12.5],
            "Low": [9.5, 10.5],
            "Close": [11.0, 12.0],
            "Adj Close": [11.0, 12.0],
            "Volume": [1000.0, float("nan")],
        },
        index=idx,
    )
    ticker = SimpleNamespace(history=lambda **kwargs: hist)
    _install_fake_yfinance(monkeypatch, ticker_obj=ticker)

    bars = market._read_prices("AAPL", "1y")
    assert [b.date for b in bars] == [date(2024, 1, 2), date(2024, 1, 3)]
    assert bars[0].volume == 1000 and bars[1].volume is None  # NaN volume -> None
    assert bars[0].close == 11.0
