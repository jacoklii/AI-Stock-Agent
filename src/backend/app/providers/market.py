"""Market-data provider wrapper (yFinance).

The single file a yFinance -> Polygon/IEX swap would touch. yFinance is synchronous and does
blocking network I/O, so every call is dispatched to a worker thread (``asyncio.to_thread``)
to keep the async event loop free. Exposes three capabilities the tools/workflows need: a batch
quote (last price + change vs previous close) for arbitrary symbols including index/forex/futures
forms like ``^VIX`` / ``DX-Y.NYB`` / ``GC=F``; daily OHLCV bars; and financial-statement periods.

Reporting figures are **facts** — revenue, EBITDA, EPS, etc. The provider extracts them and
leaves ``None`` where the source had no value; it never derives a buy/sell/hold or valuation call.
"""

from __future__ import annotations

import asyncio
from datetime import date

from pydantic import BaseModel


class Quote(BaseModel):
    """A point-in-time reading for one instrument. ``None`` where the provider had no data."""

    symbol: str
    price: float | None = None
    previous_close: float | None = None
    change: float | None = None
    change_pct: float | None = None


class PriceBar(BaseModel):
    """One daily OHLCV bar. ``None`` where the source had no value."""

    date: date
    open: float | None = None
    high: float | None = None
    low: float | None = None
    close: float | None = None
    adj_close: float | None = None
    volume: int | None = None


class FinancialStatement(BaseModel):
    """One reporting period's headline figures. Point-in-time fields (``price``/``market_cap``/
    ``pe``) are populated only on the most recent period; the rest are per-period statement facts."""

    period_end: date
    period_type: str  # "annual" | "quarterly"
    revenue: float | None = None
    ebitda: float | None = None
    net_income: float | None = None
    eps: float | None = None
    capex: float | None = None
    market_cap: float | None = None
    pe: float | None = None
    price: float | None = None


def _read_quote(symbol: str) -> Quote:
    """Blocking single-symbol fetch. Runs in a worker thread; never on the event loop."""
    import yfinance as yf

    try:
        # Attribute access, not .get(): FastInfo.get() keys on camelCase display names and
        # silently returns None for the snake_case property names.
        info = yf.Ticker(symbol).fast_info
        price = _as_float(info.last_price)
        prev = _as_float(info.previous_close)
    except Exception:
        # A bad/temporarily-unavailable symbol yields an empty reading, not a crash — the
        # pulse tool degrades gracefully per instrument rather than failing the whole set.
        return Quote(symbol=symbol)

    change = price - prev if price is not None and prev is not None else None
    change_pct = (change / prev * 100.0) if change is not None and prev else None
    return Quote(
        symbol=symbol,
        price=price,
        previous_close=prev,
        change=change,
        change_pct=change_pct,
    )


def _as_float(value: object) -> float | None:
    try:
        f = float(value) if value is not None else None  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    # pandas cells come back as NaN (a float) for missing values — normalize to None.
    if f is not None and f != f:
        return None
    return f


def _read_prices(symbol: str, period: str) -> list[PriceBar]:
    """Blocking daily-bar fetch. Runs in a worker thread; never on the event loop."""
    import yfinance as yf

    try:
        df = yf.Ticker(symbol).history(period=period, interval="1d", auto_adjust=False)
    except Exception:
        return []
    bars: list[PriceBar] = []
    for ts, row in df.iterrows():
        d = getattr(ts, "date", lambda: None)()
        if d is None:
            continue
        vol = _as_float(row.get("Volume"))
        bars.append(
            PriceBar(
                date=d,
                open=_as_float(row.get("Open")),
                high=_as_float(row.get("High")),
                low=_as_float(row.get("Low")),
                close=_as_float(row.get("Close")),
                adj_close=_as_float(row.get("Adj Close")),
                volume=int(vol) if vol is not None else None,
            )
        )
    return bars


def _cell(df: object, labels: tuple[str, ...], col: object) -> float | None:
    """First present row label's value at ``col`` in a yFinance statement frame, as a float."""
    if df is None:
        return None
    for label in labels:
        try:
            return _as_float(df.loc[label, col])  # type: ignore[attr-defined]
        except (KeyError, TypeError, IndexError):
            continue
    return None


def _read_financials(symbol: str) -> list[FinancialStatement]:
    """Blocking financial-statement fetch (annual + quarterly). Runs in a worker thread.

    yFinance returns statement frames keyed by line-item label with one column per period-end;
    every extraction is defensive (labels and frames vary by ticker/version) and degrades to
    ``None`` rather than raising, mirroring the per-symbol resilience of the quote path."""
    import yfinance as yf

    try:
        t = yf.Ticker(symbol)
        info = t.info or {}
    except Exception:
        return []

    out: list[FinancialStatement] = []
    frames = (
        ("annual", _frame(t, "income_stmt"), _frame(t, "cashflow")),
        ("quarterly", _frame(t, "quarterly_income_stmt"), _frame(t, "quarterly_cashflow")),
    )
    for period_type, income, cash in frames:
        if income is None:
            continue
        for col in list(getattr(income, "columns", [])):
            d = getattr(col, "date", lambda: None)()
            if d is None:
                continue
            out.append(
                FinancialStatement(
                    period_end=d,
                    period_type=period_type,
                    revenue=_cell(income, ("Total Revenue",), col),
                    ebitda=_cell(income, ("EBITDA", "Normalized EBITDA"), col),
                    net_income=_cell(income, ("Net Income", "Net Income Common Stockholders"), col),
                    eps=_cell(income, ("Diluted EPS", "Basic EPS"), col),
                    capex=_cell(cash, ("Capital Expenditure",), col),
                )
            )

    # Point-in-time snapshot (price/market cap/PE) belongs to "now" — attach it to the most
    # recent period so the panel can show a current valuation context alongside the statements.
    if out:
        latest = max(out, key=lambda s: s.period_end)
        latest.market_cap = _as_float(info.get("marketCap"))
        latest.pe = _as_float(info.get("trailingPE"))
        latest.price = _as_float(info.get("currentPrice") or info.get("previousClose"))
        if latest.eps is None:
            latest.eps = _as_float(info.get("trailingEps"))
    return out


def _frame(ticker: object, attr: str) -> object | None:
    """A yFinance statement DataFrame by attribute name, or ``None`` if unavailable/empty."""
    try:
        df = getattr(ticker, attr)
    except Exception:
        return None
    if df is None or getattr(df, "empty", False):
        return None
    return df


class MarketDataProvider:
    """Stable surface over yFinance. Construct once and reuse (cheap, stateless)."""

    async def get_quotes(self, symbols: list[str]) -> list[Quote]:
        """Live quotes for ``symbols``, in the order requested. Symbols are fetched
        concurrently across worker threads; one bad symbol does not sink the batch."""
        if not symbols:
            return []
        return await asyncio.gather(*(asyncio.to_thread(_read_quote, s) for s in symbols))

    async def get_daily_prices(self, symbol: str, *, period: str = "1y") -> list[PriceBar]:
        """Daily OHLCV bars over ``period`` (yFinance period string, e.g. ``1y``/``6mo``)."""
        return await asyncio.to_thread(_read_prices, symbol, period)

    async def get_financials(self, symbol: str) -> list[FinancialStatement]:
        """Annual + quarterly statement periods for ``symbol``, each carrying its headline figures."""
        return await asyncio.to_thread(_read_financials, symbol)


def get_market_provider() -> MarketDataProvider:
    return MarketDataProvider()
