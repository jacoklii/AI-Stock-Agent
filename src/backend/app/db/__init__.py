"""Data layer: declarative base, models, payloads, and session management.

Importing this package imports every model (via ``app.db.models``) so ``Base.metadata`` is
fully populated — used by Alembic's ``target_metadata`` and by tests.
"""

from __future__ import annotations

from app.db.base import Base, FreshnessMixin, PydanticJSONB, TimestampMixin
from app.db.session import SessionLocal, engine, get_session
from app.db import models  # noqa: F401  populate Base.metadata with all mapped classes

__all__ = [
    "Base",
    "TimestampMixin",
    "FreshnessMixin",
    "PydanticJSONB",
    "engine",
    "SessionLocal",
    "get_session",
    "models",
]
