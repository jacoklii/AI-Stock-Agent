"""Provider error taxonomy — the boundary between *external* and *internal* failure.

Every provider wrapper (LLM, embeddings, news, market, …) raises one of these when an outbound
call fails for a reason that is *not our bug*: a rate limit, a timeout, a 5xx, a malformed request.
Anything that is **not** a ``ProviderError`` is treated as internal (a DB error, a validation
failure, a logic bug) — that split is what lets the runtime record where a failure started and
lets the agent tell "the world is busy" apart from "I called the tool wrong".

``transient`` is the second axis: a transient failure is worth waiting/retrying (rate limit,
timeout, upstream blip); a non-transient one will fail the same way on retry (bad request, auth).
Callers use it to decide between backing off and giving up.
"""

from __future__ import annotations


class ProviderError(Exception):
    """An outbound call to an external dependency failed. Carries which ``provider`` and whether
    the failure is ``transient`` (retry may help) or terminal (it won't)."""

    transient: bool = False

    def __init__(self, message: str, *, provider: str, transient: bool | None = None) -> None:
        super().__init__(message)
        self.provider = provider
        if transient is not None:
            self.transient = transient


class RateLimited(ProviderError):
    """The provider rejected the call for exceeding its rate/quota (e.g. Voyage 3 RPM, HTTP 429).
    Transient: the same call succeeds once the window clears."""

    transient = True


class ProviderUnavailable(ProviderError):
    """The provider couldn't be reached or failed upstream — timeout, connection error, 5xx.
    Transient: worth a backed-off retry."""

    transient = True


class ProviderRequestError(ProviderError):
    """The provider rejected the request itself — 4xx, bad arguments, auth. Non-transient: a
    retry sends the same bad request and fails identically."""

    transient = False
