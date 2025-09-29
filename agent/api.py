"""FastAPI application exposing BlackRoad agent endpoints."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

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
    return _templates.TemplateResponse("dashboard.html", context)


@app.get("/discover/scan")
def discover_scan():
    return discover.scan()


@app.post("/discover/set")
def discover_set(j: Dict[str, Any]):
    host = j.get("host")
    user = j.get("user", "jetson")
    if not host:
        return {"ok": False, "error": "host required"}
    set_target(host, user)
    return {"ok": True, "jetson": {"host": host, "user": user}}


@app.get("/discover/target")
def discover_target():
    target = active_target()
    if not target:
        return {"ok": False, "jetson": None}
    return {"ok": True, "jetson": target}
