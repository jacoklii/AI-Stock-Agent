"""Dump the FastAPI OpenAPI schema to stdout — no running server needed.

Feeds the frontend's generated client (committed, regenerated on contract change):

    cd src/frontend && npm run gen:api

which runs this script and pipes it through openapi-typescript into src/api/schema.d.ts.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Runnable from any cwd (the frontend's gen:api invokes it from src/frontend).
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app  # noqa: E402

if __name__ == "__main__":
    print(json.dumps(app.openapi()))
