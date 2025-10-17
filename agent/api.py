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
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from agent import telemetry, jobs

app = FastAPI(title="BlackRoad API")

JETSON_HOST = "jetson.local"
JETSON_USER = "jetson"


class JobRequest(BaseModel):
    command: str


@app.get("/status")
def status():
    """Return telemetry for Pi and Jetson."""
    try:
        pi = telemetry.collect_local()
    except telemetry.TelemetryError as exc:
        pi = {"status": "error", "detail": str(exc)}

    try:
        jetson = telemetry.collect_remote(JETSON_HOST, user=JETSON_USER)
    except telemetry.TelemetryError as exc:
        jetson = {"status": "error", "detail": str(exc)}

    return {"pi": pi, "jetson": jetson}


@app.post("/run")
def run_job(req: JobRequest):
    """Run a command on the Jetson."""
    try:
        result = jobs.run_remote(JETSON_HOST, req.command, user=JETSON_USER)
    except jobs.JobError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return result


def main():
    uvicorn.run(app, host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
"""FastAPI application exposing flashing utilities and dashboard UI."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

from .flash import flash, list_devices

KNOWN_IMAGES = [
    {
        "name": "Raspberry Pi OS Lite (arm64)",
        "url": "https://downloads.raspberrypi.com/raspios_lite_arm64_latest",
    },
    {
        "name": "Ubuntu Server 24.04 (RPI arm64)",
        "url": "https://cdimage.ubuntu.com/releases/24.04/release/ubuntu-24.04.1-preinstalled-server-arm64+raspi.img.xz",
    },
    {
        "name": "BlackRoad OS (latest)",
        "url": "https://your.host/blackroad/latest.img.xz",
        "sha256": "https://your.host/blackroad/latest.sha256",
    },
]

app = FastAPI(title="BlackRoad Flasher")


@app.get("/")
def dashboard() -> HTMLResponse:
    """Serve the dashboard interface."""
    html_path = Path(__file__).resolve().parent.parent / "dashboard.html"
    html = html_path.read_text(encoding="utf-8")
    return HTMLResponse(html)


@app.get("/flash/devices")
def flash_devices() -> dict:
    """List available block devices."""
    return {"devices": list_devices()}


@app.get("/flash/images")
def flash_images() -> dict:
    """Return curated image suggestions."""
    return {"images": KNOWN_IMAGES}


@app.websocket("/ws/flash")
async def ws_flash(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        payload_raw = await websocket.receive_text()
    except WebSocketDisconnect:
        return

    try:
        payload = json.loads(payload_raw)
    except json.JSONDecodeError:
        await websocket.send_text("ERROR: invalid payload")
        await websocket.close()
        return

    device = payload.get("device", "").strip()
    image_url = payload.get("image_url", "").strip()
    sha_url: Optional[str] = (payload.get("sha256_url") or payload.get("sha_url") or "").strip() or None

    if not device or not image_url:
        await websocket.send_text("ERROR: device and image_url required")
        await websocket.close()
        return

    try:
        for line in flash(device, image_url, sha_url):
            await websocket.send_text(line)
    except WebSocketDisconnect:
        return
    except Exception as exc:  # noqa: BLE001
        await websocket.send_text(f"ERROR: {exc}")
    finally:
        await websocket.close()
