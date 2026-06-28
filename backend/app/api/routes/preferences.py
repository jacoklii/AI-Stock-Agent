"""User preferences — sectors, brief mega-caps, critical industries, channels, budget."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session, rw_session
from app.api.schemas import (
    BriefUserUpdate,
    BudgetUpdate,
    ChannelsOut,
    ChannelsUpdate,
    PreferencesOut,
)
from app.db.models.user import UserPreferences
from app.db.payloads import UserChannels

router = APIRouter(tags=["preferences"])


async def _prefs(session: AsyncSession) -> UserPreferences:
    prefs = (
        await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
    ).scalar_one_or_none()
    if prefs is None:
        raise HTTPException(status_code=404, detail="preferences not initialized")
    return prefs


def _out(prefs: UserPreferences) -> PreferencesOut:
    return PreferencesOut(
        interested_sectors=list(prefs.interested_sectors or []),
        brief_user=list(prefs.brief_user or []),
        critical_industries=list(prefs.critical_industries or []),
        weekly_token_budget=prefs.weekly_token_budget,
        channels=(
            ChannelsOut.model_validate(prefs.channels.model_dump()) if prefs.channels else None
        ),
    )


@router.get("/preferences", response_model=PreferencesOut)
async def get_preferences(session: AsyncSession = Depends(ro_session)) -> PreferencesOut:
    return _out(await _prefs(session))


@router.put("/preferences/brief-user", response_model=PreferencesOut)
async def update_brief_user(
    body: BriefUserUpdate, session: AsyncSession = Depends(rw_session)
) -> PreferencesOut:
    """Replace the user-chosen brief mega-caps (the fixed core lives in config, untouched)."""
    prefs = await _prefs(session)
    prefs.brief_user = list(body.symbols)
    await session.commit()
    return _out(prefs)


@router.put("/preferences/budget", response_model=PreferencesOut)
async def update_budget(
    body: BudgetUpdate, session: AsyncSession = Depends(rw_session)
) -> PreferencesOut:
    """Set (or clear) the weekly token budget the agent self-paces against."""
    prefs = await _prefs(session)
    prefs.weekly_token_budget = body.weekly_token_budget
    await session.commit()
    return _out(prefs)


@router.put("/preferences/channels", response_model=PreferencesOut)
async def update_channels(
    body: ChannelsUpdate, session: AsyncSession = Depends(rw_session)
) -> PreferencesOut:
    """Replace notification routing: addresses + which channels the digest and brief use."""
    prefs = await _prefs(session)
    prefs.channels = UserChannels.model_validate(body.model_dump())
    await session.commit()
    return _out(prefs)
