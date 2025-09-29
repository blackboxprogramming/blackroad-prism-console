"""FastAPI application providing the BlackRoad device dashboard."""

from __future__ import annotations

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from agent import jobs, telemetry

app = FastAPI(title="BlackRoad Dashboard")
templates = Jinja2Templates(directory="agent/templates")

JETSON_HOST = "jetson.local"
JETSON_USER = "jetson"


@app.get("/", response_class=HTMLResponse)
def home(request: Request) -> HTMLResponse:
    """Render the dashboard page with telemetry from the Pi and Jetson."""
    pi = telemetry.collect_local()
    jetson = telemetry.collect_remote(JETSON_HOST, user=JETSON_USER)
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request, "pi": pi, "jetson": jetson},
    )


@app.websocket("/ws/run")
async def ws_run(websocket: WebSocket) -> None:
    """WebSocket endpoint streaming command output from the Jetson."""
    await websocket.accept()
    try:
        cmd = await websocket.receive_text()
        for line in jobs.run_remote_stream(JETSON_HOST, cmd, user=JETSON_USER):
            await websocket.send_text(line)
        await websocket.send_text("[[BLACKROAD_DONE]]")
    except WebSocketDisconnect:
        pass
    finally:
        await websocket.close()
