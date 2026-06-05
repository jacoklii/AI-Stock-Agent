"""The shared tool-invocation adapter — schema generation over the registry (no DB)."""

from __future__ import annotations

import app.tools  # noqa: F401 — populate REGISTRY
from app.tools.invoke import tool_json_schema
from app.tools.registry import REGISTRY


def test_every_tool_produces_an_object_schema():
    for name in REGISTRY.names():
        schema = tool_json_schema(REGISTRY.get(name))
        assert schema["type"] == "object"
        assert "properties" in schema


def test_typed_input_tool_exposes_its_model():
    # screen_stocks takes a typed ScreenFilters input -> a nested 'filters' object in the schema.
    schema = tool_json_schema(REGISTRY.get("screen_stocks"))
    assert "filters" in schema["properties"]


def test_no_arg_tool_has_empty_properties():
    # get_pulse_state injects session + provider only; nothing is caller-supplied.
    schema = tool_json_schema(REGISTRY.get("get_pulse_state"))
    assert schema["properties"] == {}


def test_scalar_kwargs_become_properties():
    schema = tool_json_schema(REGISTRY.get("get_company"))
    assert {"company_id", "ticker"} <= set(schema["properties"])
