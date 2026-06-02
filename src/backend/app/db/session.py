"""Async engine and session management.

One engine per process; sessions are short-lived and created per unit of work. The
architecture keeps writes scoped to a single workflow step, so `expire_on_commit=False`
lets returned objects stay usable after commit without surprise lazy-loads.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

engine: AsyncEngine = create_async_engine(
    get_settings().database_url,
    echo=False,
    pool_pre_ping=True,
)

SessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a session bound to one unit of work (FastAPI-dependency shaped)."""
    async with SessionLocal() as session:
        yield session


@asynccontextmanager
async def readonly_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a session whose transaction is physically READ ONLY.

    This is an execution-rule "stop": tools are the AI's only path to the database, and the
    AI must never write SQL. A session handed out here runs under Postgres ``SET TRANSACTION
    READ ONLY`` (via the ``postgresql_readonly`` execution option), so any accidental INSERT/
    UPDATE/DELETE raises at the database rather than silently persisting. Tools take an
    injected session; callers compose them on top of this one.
    """
    async with SessionLocal() as session:
        await session.connection(execution_options={"postgresql_readonly": True})
        yield session
