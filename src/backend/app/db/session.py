"""Async engine and session management.

One engine per process; sessions are short-lived and created per unit of work. The
architecture keeps writes scoped to a single workflow step, so `expire_on_commit=False`
lets returned objects stay usable after commit without surprise lazy-loads.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

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
