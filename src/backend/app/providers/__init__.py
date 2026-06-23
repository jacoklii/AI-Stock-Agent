"""External-API wrappers.

Every external dependency goes behind exactly one internal wrapper before its first use, so
a provider swap (yFinance, Voyage, Anthropic, Alpha Vantage, EDGAR, a notifier) touches a
single file. Web search/fetch are Anthropic server-side tools — they ride the LLM wrapper,
no separate provider. Wrappers expose a stable, provider-agnostic surface; the third-party library is an
implementation detail kept inside the module.
"""

from __future__ import annotations

from app.providers.embeddings import EmbeddingResult, EmbeddingsProvider, get_embeddings_provider
from app.providers.llm import LLMProvider, get_llm_provider
from app.providers.market import MarketDataProvider, Quote, get_market_provider
from app.providers.alpha_vantage_news import (
    AlphaVantageNewsProvider,
    RawNewsItem,
    get_news_provider,
)
from app.providers.notifier import Notifier, SendReceipt, get_notifier
from app.providers.sec import FilingRef, SECProvider, get_sec_provider

__all__ = [
    "MarketDataProvider",
    "Quote",
    "get_market_provider",
    "EmbeddingsProvider",
    "EmbeddingResult",
    "get_embeddings_provider",
    "LLMProvider",
    "get_llm_provider",
    "AlphaVantageNewsProvider",
    "RawNewsItem",
    "get_news_provider",
    "Notifier",
    "SendReceipt",
    "get_notifier",
    "SECProvider",
    "FilingRef",
    "get_sec_provider",
]
