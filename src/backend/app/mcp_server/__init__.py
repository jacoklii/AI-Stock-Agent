"""MCP transport over the predefined tool registry.

The same tools the researcher agent calls in-process are exposed here over MCP, so an external
Claude (Claude Code in dev, or the runtime agent) reaches the database through exactly the same
predefined, read-only surface — never raw SQL, never an arbitrary fetch.
"""
