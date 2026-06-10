"""Workflow-internal DTO for digest sections.

The detailed digest isn't its own table — it's assembled into an ``analysis`` row of
``type=summary`` (``content.sections``) and read back by ``/digest/latest``. This is the shape
of one section as it passes between ``sector_research`` (producer) and ``daily_digest``
(assembler). It is neither a JSONB-column payload nor an API wire model — just a typed
hand-off between workflow steps, so it lives here in the workflow layer.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class DigestSection(BaseModel):
    section_title: str
    snapshot: str
    article_refs: list[int] = Field(default_factory=list)
    key_tickers: list[str] = Field(default_factory=list)
