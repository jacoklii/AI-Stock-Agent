"""Hermetic tests for the flat events feed (GET /events) — no Postgres, no LLM.

The route reuses ``get_news_events`` (one ``execute``), then maps each row to ``ArticleOut``. The
fake session ignores the SQL and returns the queued rows, so these assert the mapping/field
passthrough (incl. the GDELT ``domain`` + ``source_country``) and the domain enum validation; live
filtering is covered by the curl check in the plan.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fakes import FakeResult, FakeSession, use_session

_NOW = datetime.now(timezone.utc)


def _event(*, id: int, headline: str, domain: str | None, source_country: str | None = None):
    from types import SimpleNamespace

    return SimpleNamespace(
        id=id,
        company_id=None,
        url=f"https://example.com/{id}",
        source="Example",
        published_at=_NOW,
        headline=headline,
        tickers=[],
        significance=0.5,
        summary="api-grabbed summary",
        domain=SimpleNamespace(value=domain) if domain is not None else None,
        source_country=source_country,
    )


def test_events_returns_articles_with_domain_and_country(client) -> None:
    events = [_event(id=1, headline="Border clash escalates", domain="geopolitics", source_country="India")]
    use_session(FakeSession([FakeResult(scalars=events)]))

    body = client.get("/events").json()
    assert len(body) == 1
    [a] = body
    assert a["headline"] == "Border clash escalates"
    assert a["domain"] == "geopolitics"
    assert a["source_country"] == "India"
    assert a["summary"] == "api-grabbed summary"  # the API-grabbed source summary, not an AI summary


def test_events_rejects_unknown_domain(client) -> None:
    # FastAPI validates the NewsDomain query enum → 422. Override the session so the dependency's
    # setup can't reach for a real DB while the request is being rejected.
    use_session(FakeSession([]))
    assert client.get("/events", params={"domain": "nonsense"}).status_code == 422
