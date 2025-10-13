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
"""FastAPI surface for the BlackRoad device dashboard."""
"""FastAPI application exposing BlackRoad agent endpoints."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from fastapi import Body, FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from agent import discover
from agent.config import DEFAULT_USER, active_target, set_target

app = FastAPI(title="BlackRoad Device Agent")

templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))


@app.get("/", response_class=HTMLResponse)
def dashboard(request: Request) -> HTMLResponse:
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates

from agent import discover
from agent.config import active_target, set_target

app = FastAPI(title="BlackRoad Agent", docs_url="/_docs")
_templates = Jinja2Templates(directory=str(Path(__file__).resolve().parent / "templates"))


@app.get("/")
def dashboard(request: Request):
    """Serve the dashboard template."""
    context: Dict[str, Any] = {
        "request": request,
        "target": active_target(),
    }
    return templates.TemplateResponse("dashboard.html", context)


@app.get("/discover/scan")
def discover_scan() -> Dict[str, Any]:
    return _templates.TemplateResponse("dashboard.html", context)


@app.get("/discover/scan")
def discover_scan():
    return discover.scan()


@app.post("/discover/set")
def discover_set(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    host = payload.get("host")
    user = payload.get("user", DEFAULT_USER)
    if not host:
        return {"ok": False, "error": "host required"}
    try:
        set_target(host, user)
    except ValueError as exc:
        return {"ok": False, "error": str(exc)}
    except OSError as exc:
        return {"ok": False, "error": str(exc)}
    except Exception:
        return {"ok": False, "error": "failed to update target"}
def discover_set(j: Dict[str, Any]):
    host = j.get("host")
    user = j.get("user", "jetson")
    if not host:
        return {"ok": False, "error": "host required"}
    set_target(host, user)
    return {"ok": True, "jetson": {"host": host, "user": user}}


@app.get("/discover/target")
def get_target() -> Dict[str, Any]:
def discover_target():
    target = active_target()
    if not target:
        return {"ok": False, "jetson": None}
    return {"ok": True, "jetson": target}


__all__ = ["app"]
