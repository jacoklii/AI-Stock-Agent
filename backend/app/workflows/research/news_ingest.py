"""News ingest pipeline — pull Alpha Vantage events, dedupe, filter by relevance, write, re-score.

The full research surface (not just the watchlist) flows through here from **Alpha Vantage** (financial
news — macro / industry / market). Geopolitics is a *separate* source on its own steady cadence
(``gdelt_ingest``); both write ``news_events`` through the shared :func:`persist_events` core, so the
dedup / relevance / paywall / write rules are defined once here and reused. AV already curates and
scores its feed, so ingest is deliberately lean: no per-article LLM call and no embedding. Each kept
event stores AV's own extractive summary as its canonical record (the article body is never stored),
with AV's relevance as the event's ``significance``. Per-section synthesis (``section_synthesis``) is
where the AI writes prose; this path just sweeps and files.

Runs day/night on the AV cadence (and inline from the daily digest) — already-stored URLs and
near-identical headlines are skipped before the row is written, and a ``workflow_slot`` guard keeps
concurrent runs from racing. An item below ``ALPHAVANTAGE_MIN_RELEVANCE`` is dropped after dedup, and
an item from a hard-paywalled outlet (``PAYWALLED_SOURCE_DOMAINS``) is dropped too — a surfaced link is
first-class content and must actually open, so a subscription-walled source never reaches the feed.
Watchlisted companies named by new events are enqueued for re-scoring (the event trigger), and an event
at or above ``DEEP_RESEARCH_WAKEUP_SIGNIFICANCE`` wakes the autonomous researcher (signal convergence).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.config import (
    ALPHAVANTAGE_FETCH_TICKER_DEPTH,
    ALPHAVANTAGE_MIN_RELEVANCE,
    DEDUP_LOOKBACK_DAYS,
    DEEP_RESEARCH_WAKEUP_SIGNIFICANCE,
    PAYWALLED_SOURCE_DOMAINS,
    WORLD_GEOPOLITICS_KEYWORDS,
    WORLD_MACRO_KEYWORDS,
)
from app.db.enums import CoverageTier, NewsDomain
from app.db.models.news import NewsEvent
from app.utils import classify_domain, is_paywalled, matches_keywords
from app.db.session import SessionLocal, readonly_session
from app.providers.alpha_vantage_news import get_news_provider
from app.tools.research import ScreenFilters, screen_stocks
from app.workflows.concurrency import workflow_slot
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_NEWS_INGEST

# How far back to pull on a routine ingest run.
_LOOKBACK = timedelta(days=1)


@dataclass
class RawEvent:
    """Provider-shaped event before it's written (fields the fetch populates)."""

    url: str
    source: str | None
    published_at: datetime
    headline: str
    tickers: list[str] = field(default_factory=list)
    company_id: int | None = None
    # Set from the matched company's industry (free); orphan items stay unrouted (industry_id=None).
    industry_id: int | None = None
    # Alpha Vantage structure carried into ingest: the API's extractive summary (stored as the
    # canonical record), its topic-derived domain hint, and its relevance (the ingest filter + the
    # stored significance). GDELT events reuse the same fields (summary = headline, domain_hint =
    # "geopolitics", relevance = the GDELT floor).
    summary: str | None = None
    domain_hint: str | None = None
    relevance: float | None = None
    # Geographic dimension — set from GDELT's source country; null for Alpha Vantage events.
    source_country: str | None = None


async def _fetch_events() -> list[RawEvent]:
    """Pull the breadth feed (and optional watchlist depth) from Alpha Vantage.

    Breadth watches the whole market in one topic-spanning request; each article's
    ``ticker_sentiment`` resolves watchlisted names, so depth normally needs no second call. A
    dedicated ticker request is made only when ``ALPHAVANTAGE_FETCH_TICKER_DEPTH`` is on (paid keys).
    ``company_id`` resolves against every tracked company (any active tier), so a macro item naming a
    discovered mega-cap still lands on its page."""
    async with readonly_session() as session:
        tracked = await screen_stocks(session, filters=ScreenFilters(limit=1000))
    tracked = [c for c in tracked if c.coverage_tier is not CoverageTier.archived]
    by_ticker = {c.ticker: c for c in tracked}
    watchlist = [c.ticker for c in tracked if c.coverage_tier is CoverageTier.watchlist]

    since = datetime.now(timezone.utc) - _LOOKBACK
    provider = get_news_provider()
    items = await provider.fetch_breadth(since=since)
    if ALPHAVANTAGE_FETCH_TICKER_DEPTH and watchlist:
        items += await provider.fetch_for_tickers(watchlist, since=since)

    events: list[RawEvent] = []
    for item in items:
        # First tracked ticker the article mentions gives it a company home (and that company's
        # industry); the rest stay on the row's ticker list.
        company = next((by_ticker[t] for t in item.tickers if t in by_ticker), None)
        events.append(
            RawEvent(
                url=item.url,
                source=item.source,
                published_at=item.published_at,
                headline=item.headline,
                tickers=item.tickers,
                company_id=company.company_id if company else None,
                industry_id=company.industry_id if company else None,
                summary=item.summary,
                domain_hint=item.domain_hint,
                relevance=item.relevance,
            )
        )
    return events


# Headline normalization for the lexical dedup gate: lowercase, then collapse every run of
# non-alphanumerics (punctuation, whitespace) to a single space. The same story rewritten with
# different punctuation/casing across outlets normalizes to the same key.
_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def _norm_headline(headline: str) -> str:
    return _NON_ALNUM.sub(" ", headline.casefold()).strip()


def _dedupe_batch(events: list[RawEvent]) -> list[RawEvent]:
    """Drop in-batch repeats, keeping the first occurrence. Catches both URL repeats (the per-symbol
    fetch returns one article per related ticker) and the same story under one URL but reprinted by
    several outlets (matched on the normalized headline)."""
    seen_urls: set[str] = set()
    seen_headlines: set[str] = set()
    unique: list[RawEvent] = []
    for event in events:
        key = _norm_headline(event.headline)
        if event.url in seen_urls or (key and key in seen_headlines):
            continue
        seen_urls.add(event.url)
        if key:
            seen_headlines.add(key)
        unique.append(event)
    return unique


async def _existing_urls(urls: list[str]) -> set[str]:
    """URLs already stored — re-ingest skips them before the row is written."""
    if not urls:
        return set()
    async with readonly_session() as session:
        rows = await session.execute(select(NewsEvent.url).where(NewsEvent.url.in_(urls)))
        return set(rows.scalars())


async def _existing_headlines() -> set[str]:
    """Normalized headlines of recently-stored events — the lexical gate against the DB. Bounded to
    the dedup window so the same story re-crawled within a few days is dropped, but a genuinely
    recurring topic weeks later is not."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=DEDUP_LOOKBACK_DAYS)
    async with readonly_session() as session:
        rows = await session.execute(
            select(NewsEvent.headline).where(NewsEvent.published_at >= cutoff)
        )
        return {_norm_headline(h) for h in rows.scalars() if h and _norm_headline(h)}


def _resolve_domain(event: RawEvent) -> str:
    """Pick a surveillance domain: explicit geopolitics keywords first (so a sanctions/tariff item
    AV tagged ``economy_macro`` still lands in geopolitics), then Alpha Vantage's topic hint, then the
    deterministic keyword router as a final fallback."""
    text = f"{event.headline} {event.summary or ''}"
    if matches_keywords(text, WORLD_GEOPOLITICS_KEYWORDS):
        return "geopolitics"
    if event.domain_hint:
        return event.domain_hint
    return classify_domain(
        text,
        has_company=event.company_id is not None,
        has_industry=event.industry_id is not None,
        geopolitics_keywords=WORLD_GEOPOLITICS_KEYWORDS,
        macro_keywords=WORLD_MACRO_KEYWORDS,
    )


async def _enqueue_rescore(company_ids: set[int]) -> None:
    """Event trigger: enqueue watchlisted companies named by new events for re-scoring."""
    from app.workflows.analysis import company_rescore

    await company_rescore.run(company_ids=sorted(company_ids))


async def _wakeup_deep_research() -> dict:
    """Signal-convergence trigger: breadth surfaced a material event — call the researcher back."""
    from app.workflows.research import deep_research

    return await deep_research.run_autonomous()


async def persist_events(raw: list[RawEvent], task) -> tuple[set[int], bool]:
    """The shared ingest core for every source (Alpha Vantage *and* GDELT): dedupe, filter, write.

    Defined once here so both pipelines apply the same rules. Records its counts on ``task`` and
    returns ``(touched_company_ids, wake)`` for the caller's event/signal-convergence triggers —
    GDELT events name no company and clear no wakeup bar, so that caller simply ignores the return."""
    # 1. Lexical dedup gate (in-batch + already-stored URLs and normalized headlines). The source's
    #    structured/curated feed makes a semantic (embedding) dedup pass unnecessary — reworded
    #    reprints share the headline key.
    task.count("fetched", len(raw))
    unique = _dedupe_batch(raw)
    known_urls = await _existing_urls([e.url for e in unique])
    known_headlines = await _existing_headlines()
    events = [
        e
        for e in unique
        if e.url not in known_urls and _norm_headline(e.headline) not in known_headlines
    ]
    task.count("deduped", len(raw) - len(events))

    # 2. Relevance filter — trust the source's score (AV relevance / the GDELT floor) instead of an
    #    LLM importance call. Drop low-relevance items here, before anything is written.
    before_relevance = len(events)
    events = [e for e in events if (e.relevance or 0.0) >= ALPHAVANTAGE_MIN_RELEVANCE]
    task.count("dropped_low_relevance", before_relevance - len(events))

    # 3. Accessibility gate — drop hard-paywalled outlets before write so every surfaced link
    #    actually opens (article URLs are first-class content; a subscription wall is a dead end).
    before_paywall = len(events)
    events = [e for e in events if not is_paywalled(e.url, PAYWALLED_SOURCE_DOMAINS)]
    task.count("dropped_paywalled", before_paywall - len(events))

    touched: set[int] = set()
    wake = False
    async with SessionLocal() as session:
        for event in events:
            # 4. File the event: the source summary is canonical, its score is the significance, and
            #    the domain is resolved keyword-geopolitics-first → source hint → router. No LLM, no
            #    embedding — synthesis happens per-section, not per-article.
            significance = event.relevance or 0.0
            domain_key = _resolve_domain(event)
            session.add(
                NewsEvent(
                    company_id=event.company_id,
                    industry_id=event.industry_id,
                    url=event.url,
                    source=event.source,
                    published_at=event.published_at,
                    headline=event.headline,
                    tickers=event.tickers,
                    significance=significance,
                    domain=NewsDomain(domain_key),
                    summary=event.summary,
                    source_country=event.source_country,
                )
            )
            # Commit per event so a long sweep is restart-safe: an interrupted run keeps every event
            # it had already processed (the URL-unique constraint keeps a re-run idempotent), and
            # /world populates progressively instead of all-or-nothing at the end.
            await session.commit()
            if event.company_id is not None:
                touched.add(event.company_id)
            if significance >= DEEP_RESEARCH_WAKEUP_SIGNIFICANCE:
                wake = True
            task.count("written")
    return touched, wake


async def run() -> None:
    # One ingest at a time: the scheduled job and the digest's inline call would otherwise race
    # past the URL dedup and collide on the unique constraint. Skips write no task row; the
    # concurrent run does the same work.
    async with workflow_slot(WF_NEWS_INGEST) as acquired:
        if not acquired:
            return

        async with run_task(WF_NEWS_INGEST) as task:
            raw = await _fetch_events()
            touched, wake = await persist_events(raw, task)

            # Enqueue re-scoring for affected companies. — event trigger
            if touched:
                await _enqueue_rescore(touched)

            # A material event clears the wakeup bar: call the researcher back, after the re-score so
            # the session sees fresh scores. — signal-convergence trigger
            if wake:
                await _wakeup_deep_research()
                task.count("wakeup")
