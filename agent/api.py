"""FastAPI endpoints for streaming local model tokens to the dashboard."""

from __future__ import annotations

import contextlib
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from . import models

app = FastAPI(title="BlackRoad Local Models")


@app.get("/models")
async def get_models() -> JSONResponse:
    """Return the available local models."""

    return JSONResponse({"models": models.list_local_models()})


@app.websocket("/ws/model")
async def ws_model(ws: WebSocket) -> None:
    """Stream llama.cpp output over the websocket connection."""

    await ws.accept()
    try:
        message = await ws.receive_json()
        model = message.get("model")
        prompt = message.get("prompt", "")
        try:
            n_predict = int(message.get("n", 128))
        except (TypeError, ValueError):
            n_predict = 128

        if not model:
            await ws.send_text("[error] model path missing")
            await ws.send_text("[[BLACKROAD_MODEL_DONE]]")
            return

        for token in models.run_llama_stream(model, prompt, n_predict=n_predict):
            await ws.send_text(token)

        await ws.send_text("[[BLACKROAD_MODEL_DONE]]")
    except WebSocketDisconnect:
        return
    except Exception as exc:  # pragma: no cover - defensive; websocket lifecycle
        await ws.send_text(f"[error] {exc}")
        await ws.send_text("[[BLACKROAD_MODEL_DONE]]")
    finally:
        with contextlib.suppress(RuntimeError):
            await ws.close()
