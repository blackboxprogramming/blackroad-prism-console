"""FastAPI app exposing the Pi flasher controls."""

from __future__ import annotations

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from agent import flash

app = FastAPI(title="BlackRoad Agent API")


@app.get("/flash/devices")
def flash_devices() -> dict:
    """Return removable devices available for flashing."""

    return {"devices": flash.list_devices()}


@app.websocket("/ws/flash")
async def ws_flash(ws: WebSocket) -> None:
    """Stream flashing progress to the dashboard."""

    await ws.accept()
    try:
        msg = await ws.receive_json()
        device = msg.get("device")
        image_url = msg.get("image_url")
        if not device or not image_url:
            await ws.send_text("ERROR: device and image_url required")
            await ws.send_text("[[BLACKROAD_DONE]]")
            return

        for line in flash.flash(image_url, device):
            await ws.send_text(line)

        await ws.send_text("[[BLACKROAD_DONE]]")
    except WebSocketDisconnect:
        return
    except Exception as exc:  # pragma: no cover - network/runtime failure
        await ws.send_text(f"ERROR: {exc}")
        await ws.send_text("[[BLACKROAD_DONE]]")
    finally:
        if ws.application_state != WebSocketState.DISCONNECTED:
            await ws.close()
