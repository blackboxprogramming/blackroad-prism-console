"""FastAPI endpoints exposing device flashing capabilities."""
from __future__ import annotations

import asyncio
import threading
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from agent import flash

app = FastAPI(title="BlackRoad Agent API")


async def _list_devices() -> list[dict[str, Any]]:
    data = await asyncio.to_thread(flash.list_devices)
    if isinstance(data, dict):
        message = data.get("error", "Failed to enumerate devices")
        raise HTTPException(status_code=500, detail=message)
    return data


@app.get("/flash/devices")
async def flash_devices() -> Dict[str, Any]:
    """Return removable block devices available for flashing."""

    devices = await _list_devices()
    return {"devices": devices}


def _start_flash_worker(
    queue: "asyncio.Queue[str | None]",
    loop: asyncio.AbstractEventLoop,
    device: str,
    image_url: str,
    safe_hdmi: bool,
    enable_ssh: bool,
    stop: threading.Event,
) -> threading.Thread:
    def worker() -> None:
        try:
            for line in flash.flash(
                image_url,
                device,
                safe_hdmi=safe_hdmi,
                enable_ssh=enable_ssh,
            ):
                if stop.is_set():
                    break
                asyncio.run_coroutine_threadsafe(queue.put(line), loop)
        except Exception as exc:  # pragma: no cover - safety net
            asyncio.run_coroutine_threadsafe(queue.put(f"ERROR: {exc}"), loop)
        finally:
            asyncio.run_coroutine_threadsafe(queue.put(None), loop)

    thread = threading.Thread(target=worker, name="flash-writer", daemon=True)
    thread.start()
    return thread


@app.websocket("/ws/flash")
async def ws_flash(ws: WebSocket) -> None:
    await ws.accept()
    stop = threading.Event()
    queue: "asyncio.Queue[str | None]" = asyncio.Queue()
    thread: Optional[threading.Thread] = None

    try:
        msg = await ws.receive_json()
        device = msg.get("device")
        image_url = msg.get("image_url")
        safe_hdmi = bool(msg.get("safe_hdmi", True))
        enable_ssh = bool(msg.get("enable_ssh", True))

        if not device or not image_url:
            await ws.send_text("ERROR: device and image_url are required")
            return

        loop = asyncio.get_running_loop()
        thread = _start_flash_worker(
            queue,
            loop,
            device,
            image_url,
            safe_hdmi,
            enable_ssh,
            stop,
        )

        while True:
            line = await queue.get()
            if line is None:
                break
            await ws.send_text(line)

        await ws.send_text("[[BLACKROAD_DONE]]")
    except WebSocketDisconnect:
        stop.set()
    except Exception as exc:  # pragma: no cover - defensive guard
        await ws.send_text(f"ERROR: {exc}")
    finally:
        stop.set()
        if thread is not None:
            thread.join(timeout=1)
        if ws.client_state == WebSocketState.CONNECTED:
            await ws.close()
