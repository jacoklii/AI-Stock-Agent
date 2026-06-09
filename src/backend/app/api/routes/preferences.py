"""User preferences — interested sectors + the user's brief mega-caps + critical industries."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session, rw_session
from app.api.schemas import BriefUserUpdate, PreferencesOut
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
        interested_sectors=list(prefs.interested_sectors or []),
        brief_user=list(prefs.brief_user or []),
        critical_industries=list(prefs.critical_industries or []),
    )


@router.put("/preferences/brief-user", response_model=PreferencesOut)
async def update_brief_user(
    body: BriefUserUpdate, session: AsyncSession = Depends(rw_session)
) -> PreferencesOut:
    """Replace the user-chosen brief mega-caps (the fixed core lives in config, untouched)."""
    prefs = (
        await session.execute(select(UserPreferences).where(UserPreferences.id == 1))
    ).scalar_one_or_none()
    if prefs is None:
        raise HTTPException(status_code=404, detail="preferences not initialized")
    prefs.brief_user = list(body.symbols)
    await session.commit()
    return PreferencesOut(
        interested_sectors=list(prefs.interested_sectors or []),
        brief_user=list(prefs.brief_user or []),
        critical_industries=list(prefs.critical_industries or []),
    )
