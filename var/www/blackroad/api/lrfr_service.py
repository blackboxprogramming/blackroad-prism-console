#!/usr/bin/env python3
"""
BlackRoad × Lucidia LRfR API
- GET /api/lrfr/requests               -> index.json
- GET /api/lrfr/requests/{id}          -> single JSON
- POST /api/lrfr/submit                -> validate + sign + persist + rebuild index

ENV:
  LRFR_DIR=/var/www/blackroad/data/requests
  PSI_SEED=(secret seed for PS-SHA∞)
"""

import datetime
import hashlib
import hmac
import json
import os
import re
import subprocess
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, PlainTextResponse

LRFR_DIR = os.environ.get("LRFR_DIR", "/var/www/blackroad/data/requests")
SCHEMA_PATH = os.path.join(LRFR_DIR, "schema.json")
INDEX_PATH = os.path.join(LRFR_DIR, "index.json")
PSI_SEED = os.environ.get("PSI_SEED", "")  # Set this! Do not commit.

app = FastAPI(title="BlackRoad LRfR API", version="2025-08-18")


def slug_ok(s: str) -> bool:
    return bool(re.match(r"^[a-z0-9][a-z0-9-]+$", s))


def ps_sha_infinity(payload: Dict[str, Any], date_iso: str) -> str:
    """
    PS-SHA∞: HMAC-SHA256 over canonical JSON + date, key = PSI_SEED.
    (Daily salt should be derived from 𝔅(t); here: just date string.)
    """
    if not PSI_SEED:
        return ""
    can = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    msg = (date_iso + "|" + can).encode("utf-8")
    sig = hmac.new(PSI_SEED.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    return sig


def rebuild_index():
    script = "/var/www/blackroad/scripts/build_lrfr_index.py"
    subprocess.run([script], check=True)


@app.get("/api/lrfr/requests")
def list_requests():
    if not os.path.exists(INDEX_PATH):
        rebuild_index()
    return FileResponse(INDEX_PATH, media_type="application/json")


@app.get("/api/lrfr/requests/{rid}")
def get_request(rid: str):
    path = os.path.join(LRFR_DIR, f"{rid}.json")
    if not os.path.exists(path):
        raise HTTPException(404, f"no such request: {rid}")
    return FileResponse(path, media_type="application/json")


@app.post("/api/lrfr/submit")
async def submit(req: Request):
    try:
        obj = await req.json()
    except Exception:
        raise HTTPException(400, "invalid json")

    rid = obj.get("id") or ""
    title = obj.get("title", "").strip()
    if not rid or not slug_ok(rid):
        raise HTTPException(400, "missing/invalid id (lowercase letters, digits, dashes)")
    if not title:
        raise HTTPException(400, "missing title")

    # Required fields minimal check
    for k in ("problem", "acceptance_criteria", "agent", "status", "created_at"):
        if not obj.get(k):
            raise HTTPException(400, f"missing {k}")

    # Sign
    date_iso = obj.get("created_at") or datetime.datetime.utcnow().isoformat()
    obj.setdefault("signing", {"algorithm": "PS-SHA∞", "signature": ""})
    obj["signing"]["signature"] = ps_sha_infinity(obj, date_iso)

    # Persist
    path = os.path.join(LRFR_DIR, f"{rid}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

    # Rebuild index
    rebuild_index()
    return PlainTextResponse(f"ok: saved {rid}\n")
