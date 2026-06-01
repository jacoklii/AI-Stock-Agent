"""Declarative base, shared column mixins, and the two custom column types.

The naming convention gives every index/constraint a deterministic name so Alembic diffs
stay stable. Mixins capture the cross-cutting columns the architecture mandates: UTC
timestamps everywhere, and freshness markers (`generated_at` / `data_through`) on anything
the UI must be able to show as stale.

The two custom column types sit at the schema's fuzzy boundaries:
- ``PydanticJSONB`` — every JSONB column is backed by a Pydantic model (in ``payloads.py``),
  validated on write and parsed to a typed object on read.
- ``embedding_vector`` — pgvector column sized to the FIXED embedding dimension.
"""

from __future__ import annotations

from datetime import datetime
from functools import cached_property
from typing import Annotated, Any

from pgvector.sqlalchemy import Vector
from pydantic import TypeAdapter
from sqlalchemy import BigInteger, DateTime, MetaData, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import TypeDecorator

from app.config import get_settings

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


# Reusable typed PK: BigInteger autoincrement primary key.
intpk = Annotated[int, mapped_column(BigInteger, primary_key=True)]


def _utcnow_column(**kwargs: Any) -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, **kwargs)


class TimestampMixin:
    """Row bookkeeping — when the row itself was written/changed (always UTC)."""

    created_at: Mapped[datetime] = _utcnow_column()
    updated_at: Mapped[datetime] = _utcnow_column(onupdate=func.now())


class FreshnessMixin:
    """Content freshness for AI outputs — `generated_at` is when it was produced,
    `data_through` is the latest input timestamp it reflects. Stale data must look stale."""

    generated_at: Mapped[datetime] = _utcnow_column()
    data_through: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PydanticJSONB(TypeDecorator):
    """Store a Pydantic model (or a container of them, e.g. ``list[Section]``) as JSONB.

    Pass the Python type to validate against: ``PydanticJSONB(MyModel)`` or
    ``PydanticJSONB(list[MyModel])``. TypeAdapter handles both shapes.
    """

    impl = JSONB
    cache_ok = True

    def __init__(self, model: Any, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.model = model

    @cached_property
    def _adapter(self) -> TypeAdapter:
        return TypeAdapter(self.model)

    def process_bind_param(self, value: Any, dialect: Any) -> Any:
        if value is None:
            return None
        # Accept already-validated models OR raw dicts/lists: validate first, then emit
        # JSON-safe primitives. Validating on write is the whole point of typing JSONB.
        validated = self._adapter.validate_python(value)
        return self._adapter.dump_python(validated, mode="json", by_alias=True)

    def process_result_value(self, value: Any, dialect: Any) -> Any:
        if value is None:
            return None
        return self._adapter.validate_python(value)


def embedding_vector() -> Vector:
    """A pgvector column sized to the configured embedding dimension."""
    return Vector(get_settings().embedding_dim)
