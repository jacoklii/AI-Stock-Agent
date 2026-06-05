"""User preferences — interested sectors + the user's pulse mega-caps."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session, rw_session
from app.api.schemas import PreferencesOut, PulseUserUpdate
from app.db.models.user import UserPreferences

router = APIRouter(tags=["preferences"])


@router.get("/preferences", response_model=PreferencesOut)
async def get_preferences(session: AsyncSession = Depends(ro_session)) -> PreferencesOut:
    prefs = (
        await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
    ).scalar_one_or_none()
    if prefs is None:
        raise HTTPException(status_code=404, detail="preferences not initialized")
    return PreferencesOut(
        interested_sectors=list(prefs.interested_sectors),
        pulse_user=list(prefs.pulse_user),
    )


@router.put("/preferences/pulse-user", response_model=PreferencesOut)
async def update_pulse_user(
    body: PulseUserUpdate, session: AsyncSession = Depends(rw_session)
) -> PreferencesOut:
    """Replace the user-chosen pulse mega-caps (the fixed core lives in config, untouched)."""
    prefs = (
        await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
    ).scalar_one_or_none()
    if prefs is None:
        raise HTTPException(status_code=404, detail="preferences not initialized")
    prefs.pulse_user = list(body.symbols)
    await session.commit()
    return PreferencesOut(
        interested_sectors=list(prefs.interested_sectors),
        pulse_user=list(prefs.pulse_user),
    )
