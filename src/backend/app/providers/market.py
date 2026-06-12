"""Market-data provider wrapper (yFinance).

The single file a yFinance -> Polygon/IEX swap would touch. yFinance is synchronous and does
blocking network I/O, so every call is dispatched to a worker thread (``asyncio.to_thread``)
to keep the async event loop free. Only the capability the tools need is exposed: a batch
quote (last price + change vs previous close) for arbitrary symbols, including index/forex/
futures forms like ``^VIX`` / ``DX-Y.NYB`` / ``GC=F`` that aren't rows in ``companies``.
"""

from __future__ import annotations

import asyncio

from pydantic import BaseModel


class Quote(BaseModel):
    """A point-in-time reading for one instrument. ``None`` where the provider had no data."""

    symbol: str
    price: float | None = None
    previous_close: float | None = None
    change: float | None = None
    change_pct: float | None = None


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
        return float(value) if value is not None else None  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None


class MarketDataProvider:
    """Stable surface over yFinance. Construct once and reuse (cheap, stateless)."""

    async def get_quotes(self, symbols: list[str]) -> list[Quote]:
        """Live quotes for ``symbols``, in the order requested. Symbols are fetched
        concurrently across worker threads; one bad symbol does not sink the batch."""
        if not symbols:
            return []
        return await asyncio.gather(*(asyncio.to_thread(_read_quote, s) for s in symbols))


def get_market_provider() -> MarketDataProvider:
    return MarketDataProvider()
