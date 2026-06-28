"""Analysis: company-level scores+prose (watchlist only) and broader analysis outputs.

Three tables on two different cadences:

- ``fundamental`` + ``sentimental`` — dense, company-level, historical. Written on every
  re-score run for watchlist companies. Headline score + rubric components in ``scores``
  (JSONB, keyed by rubric version). ``prose`` is nullable — written only on a genuine,
  threshold-crossing shift that differs meaningfully from the prior row (the embedding
  detects the difference). Both tables are watchlist-only by convention; the workflow
  layer enforces this at write time.

- ``analysis`` — broader outputs covering sectors, industries, macro, supply-chain, and
  per-stock summaries. One table because the access pattern is "what's the current /
  historical read on X?" — ``type`` is the filter. ``supporting_inputs`` (JSONB) records
  the news_event IDs and other source refs that fed this row, replacing the old citations
  table. No company_id here — subject is encoded in ``content``.

The producing LLM is recorded in ``model_name`` on every row.
"""

from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, FreshnessMixin, PydanticJSONB, TimestampMixin, embedding_vector, intpk
from app.db.enums import AnalysisType, analysis_type_enum
from app.db.payloads import AnalysisContent, AnalysisSupportingInputs, ScorePayload


class _ScoreProseColumns:
    """Shared columns for fundamental + sentimental tables."""

    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    scores: Mapped[ScorePayload | None] = mapped_column(PydanticJSONB(ScorePayload), nullable=True)
    # headline score 0-100, denormalized from scores for fast ordering/filtering
    score: Mapped[float] = mapped_column(Float)
    prose: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_name: Mapped[str] = mapped_column(String(64))
    rubric_version: Mapped[str] = mapped_column(String(32))
    embedding: Mapped[list[float] | None] = mapped_column(embedding_vector(), nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(64), nullable=True)


class Fundamental(_ScoreProseColumns, Base, TimestampMixin, FreshnessMixin):
    __tablename__ = "fundamental"
    __table_args__ = (
        Index("ix_fundamental_company_generated", "company_id", "generated_at"),
        Index(
            "ix_fundamental_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    id: Mapped[intpk]


class Sentimental(_ScoreProseColumns, Base, TimestampMixin, FreshnessMixin):
    __tablename__ = "sentimental"
    __table_args__ = (
        Index("ix_sentimental_company_generated", "company_id", "generated_at"),
        Index(
            "ix_sentimental_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    id: Mapped[intpk]


class Analysis(Base, TimestampMixin, FreshnessMixin):
    """Broader analysis: sectors, industries, macro, supply-chain, stock summaries.

    ``type`` is the discriminator. ``content`` holds the structured output (shape defined
    by the prompt/rubric for each type). ``supporting_inputs`` records provenance.
    """

    __tablename__ = "analysis"
    __table_args__ = (
        Index("ix_analysis_type_generated", "type", "generated_at"),
        Index(
            "ix_analysis_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    id: Mapped[intpk]
    type: Mapped[AnalysisType] = mapped_column(analysis_type_enum, index=True)
    content: Mapped[AnalysisContent | None] = mapped_column(PydanticJSONB(AnalysisContent), nullable=True)
    supporting_inputs: Mapped[AnalysisSupportingInputs | None] = mapped_column(
        PydanticJSONB(AnalysisSupportingInputs), nullable=True
    )
    model_name: Mapped[str] = mapped_column(String(64))
    embedding: Mapped[list[float] | None] = mapped_column(embedding_vector(), nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(64), nullable=True)
