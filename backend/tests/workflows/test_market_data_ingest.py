"""Hermetic tests for the market-data ingest upsert helpers — no Postgres. The pure functions
``_upsert_financials`` / ``_upsert_prices`` decide insert-vs-update from an in-memory existing map,
so they're testable directly against ORM instances (never committed)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from app.db.enums import PeriodType
from app.db.models.market_data import Financial, Price
from app.providers.market import FinancialStatement, PriceBar
from app.workflows.research import market_data_ingest as mdi


def test_money_conversion() -> None:
    assert mdi._money(1234.5) == Decimal("1234.5")
    assert mdi._money(None) is None


def test_upsert_financials_inserts_new_and_updates_existing() -> None:
    existing_row = Financial(
        company_id=1, period_end=date(2023, 12, 31), period_type=PeriodType.annual, revenue=Decimal("80")
    )
    existing = {(date(2023, 12, 31), PeriodType.annual): existing_row}
    stmts = [
        # Updates the existing 2023 row...
        FinancialStatement(period_end=date(2023, 12, 31), period_type="annual", revenue=100.0, ebitda=40.0),
        # ...and inserts a new 2022 row.
        FinancialStatement(period_end=date(2022, 12, 31), period_type="annual", revenue=70.0),
    ]
    new_rows = mdi._upsert_financials(existing, stmts, company_id=1)

    # Only the 2022 period is a new row; the 2023 row was mutated in place.
    assert [r.period_end for r in new_rows] == [date(2022, 12, 31)]
    assert existing_row.revenue == Decimal("100.0") and existing_row.ebitda == Decimal("40.0")


def test_upsert_financials_skips_bad_period_type() -> None:
    stmts = [FinancialStatement(period_end=date(2023, 12, 31), period_type="monthly", revenue=1.0)]
    assert mdi._upsert_financials({}, stmts, company_id=1) == []


def test_upsert_prices_inserts_new_and_updates_existing() -> None:
    existing_row = Price(company_id=1, date=date(2024, 1, 2), close=Decimal("10"))
    existing = {date(2024, 1, 2): existing_row}
    bars = [
        PriceBar(date=date(2024, 1, 2), close=11.0, volume=500),  # update
        PriceBar(date=date(2024, 1, 3), close=12.0, volume=None),  # insert
    ]
    new_rows = mdi._upsert_prices(existing, bars, company_id=1)

    assert [r.date for r in new_rows] == [date(2024, 1, 3)]
    assert existing_row.close == Decimal("11.0")
    assert new_rows[0].volume is None
