"""Researcher task output schemas — the structured deliverable each task must emit.

These are the agent's contract: every task ends by calling its ``submit`` tool whose input schema
IS one of these models, so the researcher can only return a validated, structured object — never
free-form chat. They are distinct from tool DTOs (tool *inputs/results*) and from API wire schemas
(transmission); these describe what a researcher *task produces* for its calling workflow.

The inviolable rule lives in the shape too: prose carries ``citation_event_ids`` (sources travel
with synthesis), and no field anywhere is a buy/sell/hold or a valuation call.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ArticleSummaryOut(BaseModel):
    """Per-article ingest output: the canonical summary (no raw body stored)."""

    summary: str


class SignificanceOut(BaseModel):
    """Significance classification for a news event (0 = irrelevant, 1 = highly significant)."""

    significance: float = Field(ge=0.0, le=1.0)


class SnapshotOut(BaseModel):
    """A short prose snapshot (brief movement, or top-of-digest synthesis)."""

    snapshot: str


class SectionSnapshotOut(BaseModel):
    """A digest section: orientation prose + the 1-5 key tickers to watch."""

    snapshot: str
    key_tickers: list[str] = Field(default_factory=list, max_length=5)


class CompanyProseOut(BaseModel):
    """A sparse company read. Connects dots; never a decision. Cites the events that fed it."""

    body: str
    citation_event_ids: list[int] = Field(default_factory=list)


class FollowupOut(BaseModel):
    """A scoped follow-up answer, with the source event IDs it drew on."""

    answer: str
    sources: list[int] = Field(default_factory=list)


class DeepResearchOut(BaseModel):
    """The deliverable of a bounded deep-research session: the synthesized answer plus the
    findings and open questions to promote into the durable record, and the source events drawn
    on. Observations + reasoning, never a decision or valuation call."""

    answer: str
    findings: str = ""
    open_questions: str = ""
    sources: list[int] = Field(default_factory=list)
