import os
from fastapi import FastAPI, Request, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
import uvicorn
from agent import telemetry, jobs

app = FastAPI(title="BlackRoad Dashboard")
templates = Jinja2Templates(directory="agent/templates")

JETSON_HOST = os.getenv("JETSON_HOST", "jetson.local")
JETSON_USER = os.getenv("JETSON_USER", "jetson")


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    pi = telemetry.collect_local()
    jetson = telemetry.collect_remote(JETSON_HOST, user=JETSON_USER)
    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "pi": pi,
            "jetson": jetson,
            "target": {"host": JETSON_HOST, "user": JETSON_USER},
        }
    )


@app.post("/run")
def run_job(command: str = Form(...)):
    jobs.run_remote(JETSON_HOST, command, user=JETSON_USER)
    return RedirectResponse("/", status_code=303)


@app.websocket("/ws/run")
async def ws_run(websocket: WebSocket):
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


def main():
    uvicorn.run(app, host="0.0.0.0", port=8081)
