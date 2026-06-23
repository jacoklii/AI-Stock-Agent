"""Research pipelines — the gathering half of the system.

``news_ingest`` (continuous breadth), ``deep_research`` (bounded autonomous sessions), and
``section_synthesis`` (per-section snapshots for /world + the digest). Shared runtime/triggers/
registry live one level up in ``app.workflows``.
"""
