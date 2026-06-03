"""FastAPI dependencies — request-scoped database sessions.

``ro_session`` is read-only (the default for the display surface; physically cannot write).
``rw_session`` is writable, used by the action endpoints once they're implemented.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal, readonly_session


async def ro_session() -> AsyncGenerator[AsyncSession, None]:
    async with readonly_session() as session:
        yield session


async def rw_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
