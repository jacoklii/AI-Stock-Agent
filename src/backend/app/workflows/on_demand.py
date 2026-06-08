"""On-demand research pipeline — answer a scoped follow-up from stored research first.

Invoked by the interface (a follow-up scoped to a company, industry, or theme). Answers from stored
research when it's present; only fetches externally when stored coverage is insufficient. The
researcher synthesizes the answer, which is returned to the caller (not persisted).
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.agents.researcher import get_researcher
from app.db.session import readonly_session
from app.providers.embeddings import get_embeddings_provider
from app.providers.news import get_news_provider
from app.tools.registry import TASK_FOLLOWUP
from app.tools.analysis import get_latest_prose
from app.tools.research import get_company, get_news_events, search_similar_events
from app.workflows.runtime import run_task
from app.workflows.triggers import WF_ON_DEMAND


def _is_sufficient(context: dict) -> bool:
    """Whether stored research can answer without an external fetch. — simple heuristic."""
    return bool(context.get("news") or context.get("similar"))


async def _fetch_fresh(company_ticker: str | None) -> list:
    """Pull fresh external research when stored coverage is missing/stale (not persisted here)."""
    if not company_ticker:
        return []
    since = datetime.now(timezone.utc) - timedelta(days=7)
    items = await get_news_provider().fetch_events([company_ticker], since=since)
    return items


async def _synthesize(query: str, context: dict) -> dict:
    """Researcher answers the scoped follow-up from the gathered context."""
    out = await get_researcher().run_task(
        TASK_FOLLOWUP, inputs={"query": query, **context}
    )
    return {"answer": out.answer, "sources": out.sources}


async def run(
    *, query: str, company_id: int | None = None, industry_id: int | None = None
) -> dict:
    embeddings = get_embeddings_provider()
    async with run_task(
        WF_ON_DEMAND, params={"query": query, "company_id": company_id, "industry_id": industry_id}
    ) as task:
        # 1. Gather stored research. — read tools
        async with readonly_session() as session:
            company = await get_company(session, company_id=company_id) if company_id else None
            context: dict = {
                "company": company,
                "news": await get_news_events(session, company_id=company_id, limit=30),
                "similar": await search_similar_events(session, embeddings, query_text=query, k=10),
                "prose": await get_latest_prose(session, company_id=company_id, kind="fundamental")
                if company_id
                else None,
            }

        # 2. Fetch fresh only if stored research is insufficient. — Finnhub
        if not _is_sufficient(context):
            context["fresh"] = await _fetch_fresh(company.ticker if company else None)
            task.count("fresh_fetch")

        # 3. Synthesize the answer. — researcher
        answer = await _synthesize(query, context)
        task.message("answered")
        return answer
