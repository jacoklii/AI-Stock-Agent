"""User-interest corpus — the searchable record of what this user finds valuable.

A flat set of short text "lines" assembled by the background indexer (``workflows/research/
interest_index.py``) from the user's own data: declared preferences (sectors, critical industries,
brief stocks), the questions they ask in chat, and the research topics they open. Each line carries
its summary embedding so the ``recall_preferences`` tool can return only the lines semantically
relevant to whatever the agent is weighing — preferences are *retrieved on demand*, never dumped
wholesale into a prompt.

This is the "learning" surface: as the user asks and tracks more, the corpus grows, and the agent's
judgment of what is valuable in research shifts with it. The embedding mirrors ``NewsEvent`` exactly
(same fixed model, same cosine HNSW index) so the search reuses the existing pattern. ``source_ref``
is the idempotency key — re-indexing inserts only lines not already present.
"""

from __future__ import annotations

from sqlalchemy import Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, embedding_vector, intpk


class UserInterest(Base, TimestampMixin):
    __tablename__ = "user_interest"
    __table_args__ = (
        Index(
            "ix_user_interest_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    id: Mapped[intpk]
    # Where the line came from: "declared" | "question" | "topic". A plain controlled string,
    # not a PG enum — this is an internal corpus, not a wire/storage contract that needs one.
    kind: Mapped[str] = mapped_column(String(16), index=True)
    text: Mapped[str] = mapped_column(Text)
    # Idempotency key, e.g. "sector:Energy", "chat:123", "state:45". Unique so re-indexing the
    # same source line is a no-op.
    source_ref: Mapped[str] = mapped_column(String(64), unique=True)

    embedding: Mapped[list[float] | None] = mapped_column(embedding_vector(), nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(64), nullable=True)
