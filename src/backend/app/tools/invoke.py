"""Tool-invocation adapter — the one path that turns a registered tool into a callable surface.

Both the researcher agent and the MCP server need the same two things from a ``ToolSpec``: a
JSON schema describing the arguments a caller may supply, and a way to actually run the tool with
those arguments under a read-only session. This module is that shared bridge, so the agent and
MCP never drift apart and the read-only / typed-IO invariants are enforced in exactly one place.

Convention used to split injected vs. model-facing parameters: every tool's signature is
``fn(session[, provider...], *, <model-facing kwargs>)``. Parameters BEFORE the ``*`` (``session``
and any provider) are injected by this adapter; the KEYWORD-ONLY parameters after it are what a
caller fills — and they drive the JSON schema. A dynamically built Pydantic model per tool serves
both roles: it produces the schema and it validates/coerces incoming args (enums, dates, nested
typed inputs like ``ScreenFilters``) before the call.
"""

from __future__ import annotations

import inspect
from functools import lru_cache
from typing import Any, get_type_hints

from pydantic import BaseModel, create_model

from app.db.session import SessionLocal, readonly_session
from app.providers.embeddings import get_embeddings_provider
from app.providers.market import get_market_provider
from app.providers.notifier import get_notifier
from app.providers.sec import get_sec_provider
from app.providers.web import get_web_provider
from app.tools.registry import ToolSpec

# Injected (pre-``*``) parameter name -> factory. ``session`` is handled separately.
_PROVIDER_FACTORIES = {
    "market_provider": get_market_provider,
    "embeddings_provider": get_embeddings_provider,
    "web_provider": get_web_provider,
    "sec_provider": get_sec_provider,
    "notifier": get_notifier,
}


@lru_cache(maxsize=None)
def _params_model(name: str) -> type[BaseModel]:
    """Build (once per tool) a Pydantic model of the tool's keyword-only parameters."""
    from app.tools.registry import REGISTRY

    spec = REGISTRY.get(name)
    sig = inspect.signature(spec.fn)
    hints = get_type_hints(spec.fn)
    fields: dict[str, tuple[Any, Any]] = {}
    for pname, p in sig.parameters.items():
        if p.kind is not inspect.Parameter.KEYWORD_ONLY:
            continue  # session + providers are injected, never caller-supplied
        annotation = hints.get(pname, Any)
        default = ... if p.default is inspect.Parameter.empty else p.default
        fields[pname] = (annotation, default)
    return create_model(f"{spec.name}__params", **fields)  # type: ignore[call-overload]


def tool_json_schema(spec: ToolSpec) -> dict[str, Any]:
    """JSON Schema for a tool's caller-supplied arguments (the agent/MCP input_schema)."""
    return _params_model(spec.name).model_json_schema()


def _dump(result: Any) -> Any:
    if result is None:
        return None
    if isinstance(result, BaseModel):
        return result.model_dump(mode="json")
    if isinstance(result, list):
        return [_dump(item) for item in result]
    return result


async def invoke_tool(spec: ToolSpec, args: dict[str, Any]) -> Any:
    """Validate ``args`` against the tool's params model, inject a session (and any provider the
    signature asks for), call the tool, and return a JSON-serializable result.

    Read tools (the default) get a physically READ-ONLY session — the central enforcement point
    for the AI-facing tool surface. The few predefined write tools (``spec.writes``: research-state
    and cache) get a writable session and commit their own work; no production-data table has a
    write tool, so the AI still cannot write production rows through any path here."""
    validated = _params_model(spec.name)(**args)
    kwargs = {name: getattr(validated, name) for name in type(validated).model_fields}

    sig = inspect.signature(spec.fn)
    injected = [
        p.name
        for p in sig.parameters.values()
        if p.kind is not inspect.Parameter.KEYWORD_ONLY
    ]
    session_cm = SessionLocal() if spec.writes else readonly_session()
    async with session_cm as session:
        positional = []
        for pname in injected:
            if pname == "session":
                positional.append(session)
            elif pname in _PROVIDER_FACTORIES:
                positional.append(_PROVIDER_FACTORIES[pname]())
            else:  # pragma: no cover - guards an unknown injected dependency
                raise ValueError(f"tool {spec.name!r} asks for unknown injected param {pname!r}")
        result = await spec.fn(*positional, **kwargs)
    return _dump(result)
