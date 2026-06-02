"""Shared test fixtures.

``pytest-asyncio`` (auto mode) runs each test in its own event loop, while the app's async
engine is a module-level singleton that pools connections. A pooled connection bound to one
test's loop is unusable in the next ("Event loop is closed"). Disposing the engine after each
test — within that test's own loop — drops the pool so the next test opens fresh connections.
"""

from __future__ import annotations

import pytest

from app.db.session import engine


@pytest.fixture(autouse=True)
async def _dispose_engine_between_tests():
    yield
    await engine.dispose()
