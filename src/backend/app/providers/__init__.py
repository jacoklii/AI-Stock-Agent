"""External-API wrappers.

Every external dependency goes behind exactly one internal wrapper before its first use, so
a provider swap (yFinance, Voyage, a notifier, Anthropic) touches a single file. Wrappers
expose a stable, provider-agnostic surface; the third-party library is an implementation
detail kept inside the module.

This pass ships only the two wrappers the read-only tools require:
- ``market`` — live quotes (yFinance), for ``get_pulse_state``.
- ``embeddings`` — query embedding (Voyage), for ``search_similar_events``.
"""

from __future__ import annotations

from app.providers.embeddings import EmbeddingResult, EmbeddingsProvider, get_embeddings_provider
from app.providers.market import MarketDataProvider, Quote, get_market_provider

__all__ = [
    "MarketDataProvider",
    "Quote",
    "get_market_provider",
    "EmbeddingsProvider",
    "EmbeddingResult",
    "get_embeddings_provider",
]
