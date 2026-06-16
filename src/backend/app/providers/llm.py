"""LLM provider wrapper (Anthropic).

The single file a model-provider swap would touch. This is **transport only**: it wraps the
async Anthropic client and exposes one ``create`` call mirroring the Messages API (system +
messages + tools + tool_choice). The agentic tool-use loop — deciding which tool to call,
feeding results back, enforcing the structured submit — lives in the researcher agent, not
here, so the agent's behaviour is independent of the SDK.

The model is chosen per task by the agent (one of the ``MODEL_*`` constants), not fixed here.
The producing model NAME is what the agent records on every analysis row.
"""

from __future__ import annotations

from typing import Any

from app.config import get_settings
from app.providers.errors import ProviderRequestError, ProviderUnavailable, RateLimited


def _classify(exc: Exception) -> ProviderRequestError | ProviderUnavailable | RateLimited | None:
    """Map an Anthropic SDK exception onto the provider taxonomy, by status code / type name so we
    never hard-import the SDK exception classes. Returns ``None`` if it isn't a recognizable
    transport error (then it's treated as internal upstream)."""
    status = getattr(exc, "status_code", None)
    name = type(exc).__name__.lower()
    if status == 429 or "ratelimit" in name:
        return RateLimited(f"anthropic rate limit: {exc}", provider="anthropic")
    if (isinstance(status, int) and status >= 500) or "timeout" in name or "connection" in name:
        return ProviderUnavailable(f"anthropic unavailable: {exc}", provider="anthropic")
    if isinstance(status, int) and 400 <= status < 500:
        return ProviderRequestError(f"anthropic rejected request ({status}): {exc}", provider="anthropic")
    return None


class LLMProvider:
    """Stable surface over the Anthropic Messages API. Async-native (no thread dispatch)."""

    def __init__(self) -> None:
        settings = get_settings()
        self._api_key = settings.anthropic_api_key
        self._timeout = settings.llm_timeout_s
        self._max_retries = settings.llm_max_retries
        self._client: Any | None = None

    def _ensure_client(self) -> Any:
        # Lazy so importing this module never requires the SDK/key to be present — only an
        # actual call does. Keeps import-smoke and tests with a placeholder key clean.
        # ``timeout``/``max_retries`` bound a hung call: the SDK backs off on transient errors
        # itself, and a call that never returns trips the timeout instead of stalling a session.
        if self._client is None:
            from anthropic import AsyncAnthropic

            self._client = AsyncAnthropic(
                api_key=self._api_key, timeout=self._timeout, max_retries=self._max_retries
            )
        return self._client

    async def create(
        self,
        *,
        model: str,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        tool_choice: dict[str, Any] | None = None,
        max_tokens: int = 4096,
        container: str | None = None,
        extra_headers: dict[str, str] | None = None,
    ) -> Any:
        """One round-trip to the model. Returns the raw Anthropic response (the agent reads
        ``.content`` blocks and ``.stop_reason``). Optional ``tools``/``tool_choice`` drive the
        tool-use loop the agent runs.

        Prompt caching is always on (top-level ``cache_control``): the request prefix renders
        tools -> system -> messages, and the API auto-caches up to the last cacheable block. In
        the agent's loop the tool list and system prompt are frozen and the conversation only
        grows, so iteration N reads iteration N-1's prefix at ~0.1x input price and writes one
        small increment at 1.25x. ``tool_choice`` flips don't invalidate the cache; tool-list
        changes do — which is why callers must keep ``tools`` byte-stable across a loop."""
        client = self._ensure_client()
        kwargs: dict[str, Any] = {
            "model": model,
            "system": system,
            "messages": messages,
            "max_tokens": max_tokens,
            "cache_control": {"type": "ephemeral"},
        }
        if tools is not None:
            kwargs["tools"] = tools
        if tool_choice is not None:
            kwargs["tool_choice"] = tool_choice
        if container is not None:
            # Server-side tools (web fetch) execute in a server container; a turn that pauses
            # with pending tool uses can only resume against the same container id.
            kwargs["container"] = container
        if extra_headers is not None:
            kwargs["extra_headers"] = extra_headers
        try:
            return await client.messages.create(**kwargs)
        except Exception as exc:  # noqa: BLE001 — classify transport failures, re-raise the rest
            mapped = _classify(exc)
            if mapped is not None:
                raise mapped from exc
            raise


def get_llm_provider() -> LLMProvider:
    return LLMProvider()
