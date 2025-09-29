"""FastAPI application powering the agent dashboard."""

from __future__ import annotations

import json
import pathlib
from typing import Any

from fastapi import File, Request, UploadFile, WebSocket, WebSocketDisconnect
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from agent import transcribe

app = FastAPI(title="BlackRoad Agent Dashboard")
templates = Jinja2Templates(directory=str(pathlib.Path(__file__).parent / "templates"))


@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request) -> HTMLResponse:
    """Render the dashboard UI."""

    return templates.TemplateResponse("dashboard.html", {"request": request})


@app.post("/transcribe/upload")
async def transcribe_upload(file: UploadFile = File(...)) -> dict[str, Any]:
    data = await file.read()
    suffix = pathlib.Path(file.filename or "audio.wav").suffix
    path = transcribe.save_upload(data, suffix=suffix)
    token = pathlib.Path(path).name
    return {"token": token}


@app.websocket("/ws/transcribe/run")
async def ws_transcribe(ws: WebSocket) -> None:
    await ws.accept()
    try:
        try:
            msg = await ws.receive_text()
        except WebSocketDisconnect:
            return
        except Exception:  # pragma: no cover - unexpected
            await ws.send_text("[error] invalid request")
            return

        try:
            payload = json.loads(msg)
        except json.JSONDecodeError:
            await ws.send_text("[error] invalid json")
            return

        token = payload.get("token")
        lang = payload.get("lang", "en")
        model = payload.get("model")

        if not token:
            await ws.send_text("[error] missing token")
            return

        candidate = (transcribe.TMP_DIR / token).resolve()
        try:
            candidate.relative_to(transcribe.TMP_DIR)
        except ValueError:
            await ws.send_text("[error] bad token")
            return

        if not candidate.exists():
            await ws.send_text("[error] audio not found")
            return

        for line in transcribe.run_whisper_stream(str(candidate), model_path=model, lang=lang):
            await ws.send_text(line)

        await ws.send_text("[[BLACKROAD_WHISPER_DONE]]")
    finally:
        try:
            await ws.close()
        except WebSocketDisconnect:
            pass
        except RuntimeError:
            # Connection already closed or closing; safe to ignore.
            pass
