"""External-API wrappers.

Every external dependency goes behind exactly one internal wrapper before its first use, so
a provider swap (yFinance, Voyage, Anthropic, Finnhub, Tavily, EDGAR, a notifier) touches a
single file. Wrappers expose a stable, provider-agnostic surface; the third-party library is an
implementation detail kept inside the module.
"""

from __future__ import annotations

from app.providers.embeddings import EmbeddingResult, EmbeddingsProvider, get_embeddings_provider
from app.providers.llm import LLMProvider, get_llm_provider
from app.providers.market import MarketDataProvider, Quote, get_market_provider
from app.providers.news import NewsProvider, RawNewsItem, get_news_provider
from app.providers.notifier import Notifier, SendReceipt, get_notifier
from app.providers.sec import FilingRef, SECProvider, get_sec_provider
from app.providers.web import WebResult, WebSearchProvider, get_web_provider

__all__ = [
    "MarketDataProvider",
    "Quote",
    "get_market_provider",
    "EmbeddingsProvider",
    "EmbeddingResult",
    "get_embeddings_provider",
    "LLMProvider",
    "get_llm_provider",
    "NewsProvider",
    "RawNewsItem",
    "get_news_provider",
    "Notifier",
    "SendReceipt",
    "get_notifier",
    "WebSearchProvider",
    "WebResult",
    "get_web_provider",
    "SECProvider",
    "FilingRef",
    "get_sec_provider",
]
