"""Hermetic tests for first-boot defaults — no Postgres.

The contract: an empty database gets the full default universe (industries vocabulary,
popular mega-caps, the preferences singleton); an initialized database is left untouched —
``ensure_defaults`` never modifies existing rows.
"""

from __future__ import annotations

from types import SimpleNamespace

from app.config import DEFAULT_COMPANIES, DEFAULT_INDUSTRIES, DEFAULT_WEEKLY_TOKEN_BUDGET
from app.db.bootstrap import ensure_defaults
from app.db.models.companies import Company, Industry
from app.db.models.user import UserPreferences


class _Result:
    def __init__(self, *, scalars=None, rows=None, scalar=None):
        self._scalars = scalars or []
        self._rows = rows or []
        self._scalar = scalar

    def scalars(self):
        return iter(self._scalars)

    def all(self):
        return list(self._rows)

    def scalar_one_or_none(self):
        return self._scalar


class _Session:
    """Queue-driven AsyncSession stand-in: each execute pops the next result."""

    def __init__(self, results):
        self.results = list(results)
        self.added = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def execute(self, stmt):
        return self.results.pop(0)

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        pass

    async def commit(self):
        pass


_KEY_IDS = [(spec["key"], i + 1) for i, spec in enumerate(DEFAULT_INDUSTRIES)]


async def test_empty_database_gets_full_defaults() -> None:
    session = _Session(
        [
            _Result(scalars=[]),        # no industries yet
            _Result(rows=_KEY_IDS),     # key -> id after flush
            _Result(scalars=[]),        # no companies yet
            _Result(scalar=None),       # no preferences row
        ]
    )
    created = await ensure_defaults(session_factory=lambda: session)

    assert created == {
        "industries": len(DEFAULT_INDUSTRIES),
        "companies": len(DEFAULT_COMPANIES),
        "preferences": 1,
    }
    industries = [o for o in session.added if isinstance(o, Industry)]
    companies = [o for o in session.added if isinstance(o, Company)]
    prefs = [o for o in session.added if isinstance(o, UserPreferences)]
    assert len(industries) == len(DEFAULT_INDUSTRIES)
    assert len(companies) == len(DEFAULT_COMPANIES)

    key_to_id = dict(_KEY_IDS)
    nvda = next(c for c in companies if c.ticker == "NVDA")
    assert nvda.industry_id == key_to_id["semiconductors"]

    assert prefs[0].weekly_token_budget == DEFAULT_WEEKLY_TOKEN_BUDGET
    assert prefs[0].brief_user  # popular mega-caps preset
    assert prefs[0].channels is not None  # routing defaults exist for the message workflows


async def test_initialized_database_is_untouched() -> None:
    session = _Session(
        [
            _Result(scalars=[spec["key"] for spec in DEFAULT_INDUSTRIES]),
            _Result(rows=_KEY_IDS),
            _Result(scalars=[spec["ticker"] for spec in DEFAULT_COMPANIES]),
            _Result(scalar=SimpleNamespace(id=1)),  # prefs row exists
        ]
    )
    created = await ensure_defaults(session_factory=lambda: session)

    assert created == {"industries": 0, "companies": 0, "preferences": 0}
    assert session.added == []


async def test_partial_database_fills_only_gaps() -> None:
    # One industry and one company already exist (user-created or earlier boot).
    session = _Session(
        [
            _Result(scalars=["semiconductors"]),
            _Result(rows=_KEY_IDS),
            _Result(scalars=["NVDA"]),
            _Result(scalar=SimpleNamespace(id=1)),
        ]
    )
    created = await ensure_defaults(session_factory=lambda: session)

    assert created["industries"] == len(DEFAULT_INDUSTRIES) - 1
    assert created["companies"] == len(DEFAULT_COMPANIES) - 1
    assert created["preferences"] == 0
    assert all(getattr(o, "ticker", None) != "NVDA" for o in session.added)
