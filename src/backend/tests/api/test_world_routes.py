"""Hermetic tests for the world surveillance feed — no Postgres, no LLM.

The contract: ``GET /world`` reuses the latest digest as the overview, groups stored (AV-swept)
events into the four ordered domains via the keyword classifier, attaches the agent's per-section
synthesis, and splits the ranked signals into Now / Building by horizon. The session is faked: the
first ``execute`` is the digest scan, the second is the news-event scan, the third is the
section-summary scan.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from fakes import FakeResult, FakeSession, use_session

_NOW = datetime.now(timezone.utc)


def _event(
    *,
    id: int,
    headline: str,
    summary: str = "",
    significance: float,
    published_at: datetime,
    company_id: int | None = None,
    industry_id: int | None = None,
    tickers: list[str] | None = None,
    domain: str | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=id,
        headline=headline,
        summary=summary,
        significance=significance,
        published_at=published_at,
        url=f"https://example.com/{id}",
        source="Example",
        tickers=tickers or [],
        company_id=company_id,
        industry_id=industry_id,
        # Mirrors the ORM column: None falls back to the keyword router; set value overrides it.
        domain=SimpleNamespace(value=domain) if domain is not None else None,
    )


def _section(section_key: str, snapshot: str, key_tickers: list[str] | None = None) -> SimpleNamespace:
    return SimpleNamespace(
        section_key=section_key,
        snapshot=snapshot,
        payload=SimpleNamespace(key_tickers=key_tickers or []),
    )


def test_world_groups_events_into_four_ordered_domains(client) -> None:
    events = [
        _event(id=1, headline="Sanctions tighten on the strait", significance=0.9, published_at=_NOW),
        _event(id=2, headline="Inflation cools as the Fed holds rates", significance=0.8, published_at=_NOW),
        _event(id=3, headline="NVDA ships next-gen accelerators", significance=0.7,
               published_at=_NOW, company_id=5, tickers=["NVDA"]),
        _event(id=4, headline="Semiconductor capacity expands", significance=0.65,
               published_at=_NOW, industry_id=3),
    ]
    use_session(
        FakeSession([FakeResult(scalars=[]), FakeResult(scalars=events), FakeResult(scalars=[])])
    )

    body = client.get("/world").json()
    assert [d["key"] for d in body["domains"]] == ["geopolitics", "macro", "industry", "market"]
    by_key = {d["key"]: d for d in body["domains"]}
    assert by_key["geopolitics"]["items"][0]["title"] == "Sanctions tighten on the strait"
    assert by_key["macro"]["items"][0]["title"].startswith("Inflation cools")
    assert by_key["market"]["items"][0]["tickers"] == ["NVDA"]
    assert by_key["industry"]["items"][0]["title"] == "Semiconductor capacity expands"
    # Stored events are AV-swept; significance is never echoed as a number.
    assert by_key["geopolitics"]["items"][0]["origin"] == "swept"
    assert "significance" not in by_key["geopolitics"]["items"][0]
    # No section_summary rows in the fake → each domain's synthesis is null.
    assert by_key["geopolitics"]["summary"] is None
    assert by_key["geopolitics"]["key_tickers"] == []
    assert body["overview"] is None  # no digest row in the fake


def test_world_attaches_section_synthesis_per_domain(client) -> None:
    events = [
        _event(id=2, headline="Inflation cools as the Fed holds rates", significance=0.8, published_at=_NOW),
    ]
    sections = [_section("macro", "Rates steady; inflation easing.", ["TLT", "SPY"])]
    use_session(
        FakeSession(
            [FakeResult(scalars=[]), FakeResult(scalars=events), FakeResult(scalars=sections)]
        )
    )

    body = client.get("/world").json()
    by_key = {d["key"]: d for d in body["domains"]}
    assert by_key["macro"]["summary"] == "Rates steady; inflation easing."
    assert by_key["macro"]["key_tickers"] == ["TLT", "SPY"]
    # A domain with no section row stays null.
    assert by_key["geopolitics"]["summary"] is None


def test_world_prefers_stored_domain_over_heuristic(client) -> None:
    # A company-named event would key to "market" by the heuristic, but the stored domain wins.
    events = [
        _event(id=1, headline="NVDA ships chips", significance=0.7, published_at=_NOW,
               company_id=5, tickers=["NVDA"], domain="macro"),
    ]
    use_session(
        FakeSession([FakeResult(scalars=[]), FakeResult(scalars=events), FakeResult(scalars=[])])
    )

    body = client.get("/world").json()
    by_key = {d["key"]: d for d in body["domains"]}
    assert by_key["macro"]["items"][0]["title"] == "NVDA ships chips"
    assert by_key["market"]["items"] == []


def test_world_signals_split_now_and_building(client) -> None:
    # Older than the 48h Now window but still inside the 7-day display shelf-life: surfaces, as
    # Building. (A genuinely week-old item is filtered out in SQL before it ever reaches here.)
    old = _NOW - timedelta(days=3)
    events = [
        _event(id=1, headline="Fresh material event", significance=0.95, published_at=_NOW),
        _event(id=2, headline="Stale but notable", significance=0.95, published_at=old),
    ]
    use_session(
        FakeSession([FakeResult(scalars=[]), FakeResult(scalars=events), FakeResult(scalars=[])])
    )

    body = client.get("/world").json()
    now_titles = [s["title"] for s in body["signals_now"]]
    building_titles = [s["title"] for s in body["signals_building"]]
    assert "Fresh material event" in now_titles
    assert "Stale but notable" in building_titles
