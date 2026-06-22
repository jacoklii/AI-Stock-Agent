"""Chat — the persistent direction surface.

One linear thread. ``POST`` persists the user message, answers it with the lightweight followup
workflow (Sonnet + read tools; budget-gated), and persists the assistant reply with its typed
sources — article URLs ride along so the UI keeps links first-class. Deeper work is explicit:
the UI's "Go deeper" posts the message text to ``POST /research`` instead.

An answer can take tens of seconds (tool-using LLM call); the request is held open — proxies are
configured with generous read timeouts for this path.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ro_session, rw_session
from app.api.schemas import ChatMessageCreate, ChatMessageOut
from app.db.enums import ChatRole
from app.db.models.chat import ChatMessage
from app.db.models.news import NewsEvent
from app.db.payloads import ChatSources
from app.workflows.research import followup as followup_wf

router = APIRouter(tags=["chat"])


def _message_out(row: ChatMessage) -> ChatMessageOut:
    sources = row.sources or ChatSources()
    return ChatMessageOut(
        id=row.id,
        role=row.role,
        content=row.content,
        news_event_ids=list(sources.news_event_ids),
        source_urls=list(sources.urls),
        state_id=row.state_id,
        created_at=row.created_at,
    )


@router.get("/chat/messages", response_model=list[ChatMessageOut])
async def list_messages(
    limit: int = 50,
    before_id: int | None = None,
    session: AsyncSession = Depends(ro_session),
) -> list[ChatMessageOut]:
    """The thread, oldest-first. Keyset pagination: pass ``before_id`` to page back."""
    stmt = select(ChatMessage).order_by(ChatMessage.id.desc()).limit(min(limit, 200))
    if before_id is not None:
        stmt = stmt.where(ChatMessage.id < before_id)
    rows = list((await session.execute(stmt)).scalars())
    rows.reverse()
    return [_message_out(r) for r in rows]


@router.post("/chat/messages", response_model=list[ChatMessageOut])
async def post_message(
    body: ChatMessageCreate, session: AsyncSession = Depends(rw_session)
) -> list[ChatMessageOut]:
    """Ask the agent. Returns the persisted [user, assistant] pair for the client to append."""
    user_row = ChatMessage(role=ChatRole.user, content=body.content)
    session.add(user_row)
    await session.commit()

    out = await followup_wf.run(
        query=body.content, company_id=body.company_id, industry_id=body.industry_id
    )

    urls: list[str] = []
    if out.sources:
        urls = list(
            (
                await session.execute(select(NewsEvent.url).where(NewsEvent.id.in_(out.sources)))
            ).scalars()
        )
    # External pages the agent consulted (server-side web tools) ride along with article URLs.
    urls = list(dict.fromkeys([*urls, *out.source_urls]))
    assistant_row = ChatMessage(
        role=ChatRole.assistant,
        content=out.answer,
        sources=ChatSources(news_event_ids=out.sources, urls=urls),
    )
    session.add(assistant_row)
    await session.commit()

    # The escalation hint is live-only — it rides the fresh reply so the UI can offer "dig deeper",
    # but isn't persisted (a reloaded thread shows the answer, not a stale nudge).
    assistant_out = _message_out(assistant_row)
    assistant_out.suggest_deeper = out.suggest_deeper
    assistant_out.deeper_topic = out.deeper_topic
    return [_message_out(user_row), assistant_out]
