"""On-demand research pipeline — answer a scoped follow-up from stored research first.

Invoked by the interface (a follow-up scoped to a company, sector, or theme). Answers from
stored research when it's present and fresh; only fetches externally when something is missing
or stale. The synthesized answer is returned to the caller (not persisted).

Skeleton status: gathering stored research and the sufficiency check are real; the fresh fetch
(news) and the answer synthesis (agent) are deferred.
"""

from __future__ import annotations

from app.db.enums import ProseKind
from app.db.session import readonly_session
from app.providers.embeddings import get_embeddings_provider
from app.tools.analysis import get_latest_prose
from app.tools.research import get_company, get_news_events, search_similar_events
from app.workflows.runtime import run_job
from app.workflows.triggers import WF_ON_DEMAND


def _is_sufficient(context: dict) -> bool:
    """Whether stored research can answer without an external fetch. — real (simple heuristic)."""
    return bool(context.get("news") or context.get("similar"))


async def _fetch_fresh(query: str, company_id: int | None) -> None:
    """Pull fresh external research when stored coverage is missing/stale."""
    raise NotImplementedError("TODO(news): on-demand fresh fetch")


async def _synthesize(query: str, context: dict) -> dict:
    """Researcher answers the scoped follow-up from the gathered context."""
    raise NotImplementedError("TODO(agent): followup synthesis")


async def run(*, query: str, company_id: int | None = None, sector_id: int | None = None) -> dict:
    embeddings = get_embeddings_provider()
    async with run_job(
        WF_ON_DEMAND, params={"query": query, "company_id": company_id, "sector_id": sector_id}
    ) as job:
        # 1. Gather stored research. — real
        async with readonly_session() as session:
            context: dict = {
                "company": await get_company(session, company_id=company_id) if company_id else None,
                "news": await get_news_events(session, company_id=company_id, limit=30),
                "similar": await search_similar_events(session, embeddings, query_text=query, k=10),
                "prose": await get_latest_prose(session, company_id=company_id, kind=ProseKind.fundamental)
                if company_id
                else None,
            }

        # 2. Fetch fresh only if stored research is insufficient. — TODO(news)
        if not _is_sufficient(context):
            await _fetch_fresh(query, company_id)
            job.count("fresh_fetch")

        # 3. Synthesize the answer. — TODO(agent)
        answer = await _synthesize(query, context)
        job.message("answered")
        return answer
