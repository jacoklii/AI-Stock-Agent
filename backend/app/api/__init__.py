"""Internal HTTP API (FastAPI).

The read-mostly surface the TypeScript UI talks to — the UI never touches Postgres directly.
Read endpoints are wired to the read tools / direct read-only queries and mapped into the wire
schemas in ``schemas.py``; action and workflow-trigger endpoints are defined but return ``501``
until the workflows and write paths land.

Note: the AI's "tools only, read-only" constraint binds the agent, not this layer — FastAPI may
read the database directly for display, and reuses the tools where they already fit.
"""
