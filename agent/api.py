"""FastAPI surface for the BlackRoad device dashboard."""

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
    context: Dict[str, Any] = {
        "request": request,
        "target": active_target(),
    }
    return templates.TemplateResponse("dashboard.html", context)


@app.get("/discover/scan")
def discover_scan() -> Dict[str, Any]:
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
    return {"ok": True, "jetson": {"host": host, "user": user}}


@app.get("/discover/target")
def get_target() -> Dict[str, Any]:
    target = active_target()
    if not target:
        return {"ok": False, "jetson": None}
    return {"ok": True, "jetson": target}


__all__ = ["app"]
