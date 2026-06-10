"""Web-search provider wrapper (Tavily).

The single file a web-search swap (Tavily -> Brave / SerpAPI) would touch. Two capabilities the
deep-research tools need: ``search`` (ranked results for a query) and ``fetch`` (extract a page's
readable text by URL). Reached over async ``httpx`` against Tavily's REST API — no SDK dependency.

The API key is a single configured credential; a missing key raises a clear error rather than
failing obscurely deep in a request, mirroring the notifier's WhatsApp stub.
"""

from __future__ import annotations

from pydantic import BaseModel

from app.config import get_settings

_BASE_URL = "https://api.tavily.com"


class WebResult(BaseModel):
    """One search hit — provider-agnostic shape the tools hand back."""

    title: str
    url: str
    snippet: str | None = None


class WebSearchProvider:
    """Stable surface over Tavily search + extract."""

    def __init__(self) -> None:
        self._api_key = get_settings().web_search_api_key

    def _key(self) -> str:
        if not self._api_key:
            raise RuntimeError("web search unavailable: WEB_SEARCH_API_KEY is not configured")
        return self._api_key

    async def search(self, query: str, *, k: int = 5) -> list[WebResult]:
        """Ranked results for ``query``. Network/transport lives here so callers stay
        provider-agnostic."""
        import httpx

        async with httpx.AsyncClient(base_url=_BASE_URL, timeout=20.0) as client:
            resp = await client.post(
                "/search",
                json={"api_key": self._key(), "query": query, "max_results": k},
            )
            resp.raise_for_status()
            results = resp.json().get("results", [])
        return [
            WebResult(title=r.get("title", ""), url=r.get("url", ""), snippet=r.get("content"))
            for r in results
        ]

    async def fetch(self, url: str) -> str:
        """Extract the readable text content of ``url``."""
        import httpx

        async with httpx.AsyncClient(base_url=_BASE_URL, timeout=30.0) as client:
            resp = await client.post("/extract", json={"api_key": self._key(), "urls": [url]})
            resp.raise_for_status()
            results = resp.json().get("results", [])
        return results[0].get("raw_content", "") if results else ""


def get_web_provider() -> WebSearchProvider:
    return WebSearchProvider()
