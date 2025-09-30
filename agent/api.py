"""FastAPI application exposing the BlackRoad agent API."""
from __future__ import annotations

from typing import Any, Dict

from fastapi import FastAPI

from agent.auth import TokenAuthMiddleware
from agent.config import auth_token as get_auth_token
from agent.config import load as load_cfg
from agent.config import save as save_cfg

app = FastAPI(title="BlackRoad Agent API", version="1.0.0")
app.add_middleware(TokenAuthMiddleware)


@app.get("/healthz")
def healthcheck() -> Dict[str, Any]:
    """Return a minimal health payload."""
    return {"ok": True, "auth": bool(get_auth_token())}


@app.get("/settings")
def read_settings() -> Dict[str, Any]:
    """Return the current configuration."""
    return load_cfg()


@app.post("/settings/auth")
def set_auth_token(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    """Persist a new shared authentication token."""
    token = (payload or {}).get("token", "")
    if token is None:
        token = ""
    token = str(token).strip()
    cfg = load_cfg()
    cfg.setdefault("auth", {})["token"] = token
    save_cfg(cfg)
    return {"ok": True, "enabled": bool(token)}
