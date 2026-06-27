"""Hermetic tests for the GDELT geopolitics source — no network, no Postgres, no LLM.

Covers the provider's pure mapping (DOC ``articles`` entry → ``GdeltArticle``, seendate parsing) and
the ingest seam that folds GDELT into the shared pipeline: every GDELT event is an orphan (no
company/industry), forced into the ``geopolitics`` domain, filed at the GDELT significance floor, and
tagged with its ``source_country``.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.config import GDELT_DEFAULT_SIGNIFICANCE
from app.providers import gdelt
from app.workflows.research import gdelt_ingest, news_ingest


def test_map_parses_article_and_country() -> None:
    row = {
        "url": "https://example.com/a",
        "title": "Sanctions widen as talks stall",
        "seendate": "20260624T120000Z",
        "domain": "example.com",
        "sourcecountry": "United States",
        "language": "English",
    }
    art = gdelt._map(row)
    assert art.url == "https://example.com/a"
    assert art.title == "Sanctions widen as talks stall"
    assert art.source == "example.com"
    assert art.source_country == "United States"
    assert art.published_at == datetime(2026, 6, 24, 12, 0, 0, tzinfo=timezone.utc)


def test_parse_time_falls_back_on_garbage() -> None:
    before = datetime.now(timezone.utc)
    parsed = gdelt._parse_time("not-a-date")
    assert parsed >= before  # degraded to "now", never raised


async def test_fetch_gdelt_events_are_geopolitics_orphans(monkeypatch) -> None:
    """Each GDELT article becomes a geopolitics RawEvent: no company/industry, the GDELT floor as
    relevance, the headline as summary, and the source country carried through. The fetch lives in
    the standalone gdelt_ingest pipeline; the write rules are shared from news_ingest."""

    class _FakeProvider:
        async def fetch_geopolitics(self, *, max_records=None):
            return [
                gdelt.GdeltArticle(
                    url="https://example.com/g",
                    title="Border clash escalates",
                    published_at=datetime(2026, 6, 24, tzinfo=timezone.utc),
                    source="example.com",
                    source_country="India",
                )
            ]

    monkeypatch.setattr(gdelt_ingest, "get_gdelt_provider", lambda: _FakeProvider())
    events = await gdelt_ingest._fetch_events()
    [e] = events
    assert e.company_id is None and e.industry_id is None
    assert e.domain_hint == "geopolitics"
    assert e.relevance == GDELT_DEFAULT_SIGNIFICANCE
    assert e.summary == "Border clash escalates"  # headline doubles as summary
    assert e.source_country == "India"
    # And it resolves to the geopolitics domain at write time (shared resolver in news_ingest).
    assert news_ingest._resolve_domain(e) == "geopolitics"
