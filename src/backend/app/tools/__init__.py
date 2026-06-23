"""Predefined, read-only tool catalogue.

Importing this package imports every tool module, so each tool registers itself and the
``REGISTRY`` is fully populated whenever it's consulted (by the agent's per-task allowlist or,
later, the MCP server). Tools are peers of agents and workflows: pure read functions over the
data layer (and the two provider wrappers), returning typed result models — never ORM rows,
free-form text, or SQL.
"""

from __future__ import annotations

from app.tools.analysis import (
    get_latest_analysis,
    get_latest_prose,
    get_latest_scores,
    get_score_history,
)
from app.tools.delivery import check_dedupe, deliver, send_email, send_imessage, send_whatsapp
from app.tools.registry import REGISTRY, ToolSpec, get_tools_for, tool
from app.tools.research import (
    get_brief_state,
    get_company,
    get_financials,
    get_news_events,
    get_price_history,
    screen_stocks,
    search_similar,
)
from app.tools.state import (
    close_research,
    get_research_state,
    open_research,
    update_research,
)
from app.tools.web import cache_get, cache_set, fetch_sec_filing

__all__ = [
    "REGISTRY",
    "ToolSpec",
    "tool",
    "get_tools_for",
    # research
    "get_company",
    "get_financials",
    "get_price_history",
    "get_news_events",
    "get_brief_state",
    "screen_stocks",
    "search_similar",
    # analysis
    "get_latest_scores",
    "get_score_history",
    "get_latest_prose",
    "get_latest_analysis",
    # sec / cache
    "fetch_sec_filing",
    "cache_get",
    "cache_set",
    # research state
    "open_research",
    "update_research",
    "close_research",
    "get_research_state",
    # delivery
    "check_dedupe",
    "deliver",
    "send_email",
    "send_imessage",
    "send_whatsapp",
]
