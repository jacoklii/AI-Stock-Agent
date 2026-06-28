"""Chat — the persistent direction surface between the user and the agent.

One linear thread (single-user platform): user questions and assistant answers, kept so the
conversation survives restarts and the UI can render history. Assistant rows carry typed
``sources`` (the events/URLs the answer drew on — articles stay first-class) and an optional
``state_id`` link when the exchange opened or fed a research session.

The chat is a *surface*, not a knowledge store: durable findings live in ``analysis`` /
``research_state``; a chat row is never promoted or embedded.
"""

from __future__ import annotations

from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, PydanticJSONB, TimestampMixin, intpk
from app.db.enums import ChatRole, chat_role_enum
from app.db.payloads import ChatSources


class ChatMessage(Base, TimestampMixin):
    __tablename__ = "chat_messages"

    id: Mapped[intpk]
    role: Mapped[ChatRole] = mapped_column(chat_role_enum, index=True)
    content: Mapped[str] = mapped_column(Text)
    # Assistant provenance; null on user rows.
    sources: Mapped[ChatSources | None] = mapped_column(PydanticJSONB(ChatSources), nullable=True)
    # Set when this exchange opened (or was answered from) a research session.
    state_id: Mapped[int | None] = mapped_column(
        ForeignKey("research_state.id", ondelete="SET NULL"), index=True, nullable=True
    )
