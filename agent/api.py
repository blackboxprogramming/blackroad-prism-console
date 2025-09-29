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
