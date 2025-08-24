"""Local-only Quantum Lab FastAPI service."""
from __future__ import annotations

import json
import os
import sqlite3
import time
import uuid
import urllib.request
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from starlette.middleware.sessions import SessionMiddleware

from .puzzles import simulate_chsh

# Block outbound network access except localhost
import socket

ALLOWED_HOSTS = {"127.0.0.1", "localhost", "::1"}


def _guard_network() -> None:
    real_create = socket.create_connection

    def guarded(address, *args, **kwargs):
        host, *_ = address
        if host not in ALLOWED_HOSTS:
            raise RuntimeError("Network access disabled")
        return real_create(address, *args, **kwargs)

    socket.create_connection = guarded


_guard_network()

API_TOKEN = os.getenv("QUANTUM_API_TOKEN")
DB_PATH = Path(__file__).with_name("sessions.db")
BACKEND_URL = os.getenv("PRISM_BACKEND_URL", "http://127.0.0.1:4000")

app = FastAPI(title="Quantum Lab", version="0.1", docs_url=None)
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET", "dev-secret"))


def _log_session(session_id: str, summary: dict) -> None:
    """Record session summaries with a PS-SHA∞ style hash."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(summary, sort_keys=True)
    digest = __import__("hashlib").sha3_256(payload.encode()).hexdigest()
    with sqlite3.connect(DB_PATH) as db:
        db.execute(
            "CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY, session_id TEXT, ts REAL, summary TEXT, hash TEXT)"
        )
        db.execute(
            "INSERT INTO sessions(session_id, ts, summary, hash) VALUES (?, ?, ?, ?)",
            (session_id, time.time(), payload, digest),
        )
        db.commit()


def require_auth(request: Request, x_quantum_token: str = Header(None)) -> None:
    if not request.session.get("logged_in"):
        raise HTTPException(403, "login required")
    if API_TOKEN is None or x_quantum_token != API_TOKEN:
        raise HTTPException(403, "invalid token")


@app.post("/api/quantum/login")
async def login(request: Request):
    session_id = uuid.uuid4().hex
    request.session["logged_in"] = True
    request.session["session_id"] = session_id
    return {"session_id": session_id}


@app.get("/api/quantum/chsh/simulate")
async def chsh_simulate(
    shots: int = 10000,
    noise_p: float = 0.0,
    seed: int | None = None,
    request: Request = None,
    auth: None = Depends(require_auth),
):
    summary = simulate_chsh(shots=shots, noise_p=noise_p, seed=seed)
    session_id = request.session.get("session_id", "unknown")
    _log_session(session_id, summary)
    if summary.get("S_estimate", 0) > 2:
        _report_contradiction(f"CHSH violation detected: S={summary['S_estimate']:.3f}")
    return summary


def _report_contradiction(description: str) -> None:
    """Post a contradiction to the Prism backend."""
    try:
        data = json.dumps({"module": "lucidia-math", "description": description}).encode()
        req = urllib.request.Request(
            f"{BACKEND_URL}/api/contradictions",
            data=data,
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=2)
    except Exception:  # noqa: BLE001
        pass
