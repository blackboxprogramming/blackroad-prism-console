"""FastAPI application exposing local controls for Pi-Holo and Pi-Sim."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import Body, FastAPI, HTTPException, Query
from pydantic import BaseModel, ValidationError

from agent.mac.mqtt import publish_payload
from agent.mac.validators import build_holo_text_payload, build_sim_panel_payload

app = FastAPI(title="BlackRoad Mac Control API", version="2.0.0")


@app.get("/ping")
def ping() -> Dict[str, Any]:
    """Return a simple readiness response."""
    return {"ok": True, "message": "pong"}


@app.post("/holo/text")
def holo_text(
    text: str = Query(..., min_length=1, max_length=512),
    duration_ms: int = Query(4000, ge=250, le=600_000),
    size: int = Query(64, ge=8, le=256),
    effect: Optional[str] = Query(None, max_length=64),
    topic: str = Query("holo/text", min_length=1),
) -> Dict[str, Any]:
    """Send a text command to the holographic display."""
    payload = build_holo_text_payload(text=text, duration_ms=duration_ms, size=size, effect=effect)
    publish_payload(topic, payload)
    return {"ok": True, "topic": topic, "payload": payload}


class PanelLineModel(BaseModel):
    text: str
    icon: Optional[str] = None

    class Config:
        anystr_strip_whitespace = True


class PanelRequest(BaseModel):
    panel_id: str
    lines: List[PanelLineModel]
    duration_ms: Optional[int] = None
    accent: Optional[str] = None
    brightness: Optional[int] = None
    topic: str = "sim/panel"

    class Config:
        anystr_strip_whitespace = True


@app.post("/sim/panel")
def sim_panel(request: PanelRequest = Body(...)) -> Dict[str, Any]:
    """Update the simulator panel with validated content."""
    try:
        payload = build_sim_panel_payload(
            panel_id=request.panel_id,
            lines=[line.dict(exclude_none=True) for line in request.lines],
            duration_ms=request.duration_ms,
            accent=request.accent,
            brightness=request.brightness,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=exc.errors()) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    publish_payload(request.topic, payload)
    return {"ok": True, "topic": request.topic, "payload": payload}


@app.get("/healthz")
def healthcheck() -> Dict[str, Any]:
    """Compatibility endpoint mirroring the primary agent."""
    return {"ok": True}
