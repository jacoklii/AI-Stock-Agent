"""MCP server — exposes the tool registry over the Model Context Protocol (stdio).

ARCHITECTURE: "MCP server — exposes tool registry to the AI. One tool interface across Claude Code
(dev) and runtime." This is purely a transport: it enumerates ``REGISTRY`` and routes calls through
the shared ``tools/invoke`` adapter — the same JSON schema and the same read-only execution path the
in-process agent uses. No tool logic lives here; a tool added to the registry appears here for free.

Run it as: ``python -m app.mcp_server.server`` (stdio). Importing ``app.tools`` populates the
registry.
"""

from __future__ import annotations

import json

import app.tools  # noqa: F401 — import side effect: populates REGISTRY
from app.tools.invoke import invoke_tool, tool_json_schema
from app.tools.registry import REGISTRY

SERVER_NAME = "ai-stock-agent-tools"


def build_server():
    """Construct the MCP ``Server`` with list/call handlers bound to the registry."""
    import mcp.types as types
    from mcp.server import Server

    server: Server = Server(SERVER_NAME)

    @server.list_tools()
    async def list_tools() -> list[types.Tool]:
        return [
            types.Tool(
                name=spec.name,
                description=spec.description,
                inputSchema=tool_json_schema(spec),
            )
            for spec in (REGISTRY.get(n) for n in REGISTRY.names())
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict | None) -> list[types.TextContent]:
        if name not in REGISTRY:
            raise ValueError(f"unknown tool: {name!r}")
        result = await invoke_tool(REGISTRY.get(name), arguments or {})
        return [types.TextContent(type="text", text=json.dumps(result, default=str))]

    return server


async def main() -> None:
    from mcp.server.stdio import stdio_server

    server = build_server()
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
