"""Deep analysis: scores (dense) and prose (sparse) + citations.

Two halves on different cadences, deliberately NOT coupled:
- **Scores** — numeric, dense, historical. Written on every re-score run for watchlist +
  flagged-sector companies. Fundamental and sentimental scores share a shape and trigger.
  Headline ``score`` is 0-100; rubric-specific sub-scores live in ``components`` and stay
  interpretable via ``rubric_version``.
- **Prose** — written ONLY on a genuine, threshold-crossing shift that differs meaningfully
  from the prior row (the embedding helps detect that difference). Sparse by design. Prose
  connects dots; it is never a decision or a valuation call. Each prose row's sources are
  recorded in ``citations`` (written together with the prose).

The producing LLM is recorded in ``model_name`` on every analysis row.
"""

from __future__ import annotations

from sqlalchemy import BigInteger, Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, FreshnessMixin, TimestampMixin, embedding_vector, intpk
from app.db.enums import ProseKind, prose_kind_enum
from app.db.payloads import ScoreComponents
from app.db.base import PydanticJSONB


class _ScoreColumns:
    """Shared columns for the two score tables (declarative mixin)."""

    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    score: Mapped[float] = mapped_column(Float)  # headline 0-100
    components: Mapped[ScoreComponents | None] = mapped_column(
        PydanticJSONB(ScoreComponents), nullable=True
    )
    rubric_version: Mapped[str] = mapped_column(String(32))
    model_name: Mapped[str] = mapped_column(String(64))  # LLM that produced the score


class FundamentalScore(_ScoreColumns, Base, TimestampMixin, FreshnessMixin):
    __tablename__ = "fundamental_scores"
    __table_args__ = (Index("ix_fundamental_scores_company_generated", "company_id", "generated_at"),)

    id: Mapped[intpk]


class SentimentalScore(_ScoreColumns, Base, TimestampMixin, FreshnessMixin):
    __tablename__ = "sentimental_scores"
    __table_args__ = (Index("ix_sentimental_scores_company_generated", "company_id", "generated_at"),)

    id: Mapped[intpk]


class _ProseColumns:
    """Shared columns for the two prose tables (declarative mixin)."""

    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    body: Mapped[str] = mapped_column(Text)
    model_name: Mapped[str] = mapped_column(String(64))  # LLM that produced the prose
    embedding: Mapped[list[float] | None] = mapped_column(embedding_vector(), nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(64), nullable=True)


class FundamentalProse(_ProseColumns, Base, TimestampMixin, FreshnessMixin):
    __tablename__ = "fundamental_prose"
    __table_args__ = (
        Index("ix_fundamental_prose_company_generated", "company_id", "generated_at"),
        Index(
            "ix_fundamental_prose_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    id: Mapped[intpk]


class SentimentalProse(_ProseColumns, Base, TimestampMixin, FreshnessMixin):
    __tablename__ = "sentimental_prose"
    __table_args__ = (
        Index("ix_sentimental_prose_company_generated", "company_id", "generated_at"),
        Index(
            "ix_sentimental_prose_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    id: Mapped[intpk]


class Citation(Base, TimestampMixin):
    """Provenance: links a prose row to the news_events (or other sources) that fed it.

    ``prose_id`` is a soft reference because prose is split across two tables; the
    ``prose_kind`` disambiguates which. ``news_event_id`` is a hard FK; ``source_ref``
    captures non-news provenance (e.g. a financials snapshot)."""

    __tablename__ = "citations"
    __table_args__ = (Index("ix_citations_prose", "prose_kind", "prose_id"),)

    id: Mapped[intpk]
    prose_kind: Mapped[ProseKind] = mapped_column(prose_kind_enum)
    prose_id: Mapped[int] = mapped_column(BigInteger)
    news_event_id: Mapped[int | None] = mapped_column(
        ForeignKey("news_events.id", ondelete="SET NULL"), index=True, nullable=True
    )
    source_ref: Mapped[str | None] = mapped_column(Text, nullable=True)
