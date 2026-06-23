"""Market-data ingest — refresh stored financials + daily prices for deep-coverage names.

This is the quantitative counterpart to ``news_ingest``: the slow-moving, factual layer the
CompanyDetail "Quantitative" surface and the fundamental scorer read from. It runs only for
``watchlist`` + ``industry_critical`` companies — the same cost boundary deep scoring respects.

Per the decoupled-cadence rule (``db/models/market_data.py``), financials and prices land in
separate write passes. Upserts are keyed on the tables' natural unique keys, so a re-run is
idempotent and a provider hiccup on one symbol never sinks the batch. No figure here is
interpreted — the provider extracts statement facts; nothing makes a valuation call.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import select

from app.db.enums import CoverageTier, PeriodType
from app.db.models.market_data import Financial, Price
from app.db.session import SessionLocal, readonly_session
from app.providers.market import FinancialStatement, PriceBar, get_market_provider
from app.tools.research import ScreenFilters, screen_stocks
from app.workflows.concurrency import company_lock, gather_bounded
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_MARKET_DATA_INGEST

# How much daily history to keep current on each refresh — a year covers the price-reaction and
# trend windows the scorer and panel use without unbounded growth.
_PRICE_PERIOD = "1y"


def _money(value: float | None) -> Decimal | None:
    return Decimal(str(value)) if value is not None else None


async def _targets() -> list[tuple[int, str]]:
    """The (company_id, ticker) pairs that get the quantitative layer — watchlist + critical."""
    async with readonly_session() as session:
        watchlist = await screen_stocks(
            session, filters=ScreenFilters(coverage_tier=CoverageTier.watchlist, limit=500)
        )
        critical = await screen_stocks(
            session, filters=ScreenFilters(coverage_tier=CoverageTier.industry_critical, limit=500)
        )
    return [(c.company_id, c.ticker) for c in watchlist + critical]


def _upsert_financials(existing: dict[tuple[date, PeriodType], Financial], stmts: list[FinancialStatement], company_id: int) -> list[Financial]:
    new_rows: list[Financial] = []
    for s in stmts:
        try:
            ptype = PeriodType(s.period_type)
        except ValueError:
            continue
        row = existing.get((s.period_end, ptype))
        fields = dict(
            price=_money(s.price),
            market_cap=_money(s.market_cap),
            pe=s.pe,
            eps=s.eps,
            capex=_money(s.capex),
            ebitda=_money(s.ebitda),
            revenue=_money(s.revenue),
            net_income=_money(s.net_income),
        )
        if row is None:
            new_rows.append(
                Financial(company_id=company_id, period_end=s.period_end, period_type=ptype, **fields)
            )
        else:
            for k, v in fields.items():
                setattr(row, k, v)
    return new_rows


def _upsert_prices(existing: dict[date, Price], bars: list[PriceBar], company_id: int) -> list[Price]:
    new_rows: list[Price] = []
    for b in bars:
        row = existing.get(b.date)
        fields = dict(
            open=_money(b.open),
            high=_money(b.high),
            low=_money(b.low),
            close=_money(b.close),
            adj_close=_money(b.adj_close),
            volume=Decimal(b.volume) if b.volume is not None else None,
        )
        if row is None:
            new_rows.append(Price(company_id=company_id, date=b.date, **fields))
        else:
            for k, v in fields.items():
                setattr(row, k, v)
    return new_rows


async def _refresh_one(company_id: int, ticker: str) -> int:
    """Fetch + upsert one company's financials and daily prices. Returns rows touched."""
    provider = get_market_provider()
    stmts = await provider.get_financials(ticker)
    bars = await provider.get_daily_prices(ticker, period=_PRICE_PERIOD)
    if not stmts and not bars:
        return 0

    async with company_lock(company_id):
        async with SessionLocal() as session:
            fin_existing = {
                (f.period_end, f.period_type): f
                for f in (
                    await session.execute(select(Financial).where(Financial.company_id == company_id))
                ).scalars()
            }
            price_existing = {
                p.date: p
                for p in (
                    await session.execute(select(Price).where(Price.company_id == company_id))
                ).scalars()
            }
            session.add_all(_upsert_financials(fin_existing, stmts, company_id))
            session.add_all(_upsert_prices(price_existing, bars, company_id))
            await session.commit()
    return len(stmts) + len(bars)


async def run() -> None:
    async with run_task(WF_MARKET_DATA_INGEST) as task:
        targets = await _targets()
        task.count("companies", len(targets))
        touched = await gather_bounded([_refresh_one(cid, ticker) for cid, ticker in targets])
        task.count("rows", sum(t for t in touched if isinstance(t, int)))
