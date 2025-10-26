"""ASGI server exposing the Socket.IO presence bus and dashboards."""
from __future__ import annotations

import logging
import time
from typing import Any, Dict, Mapping, MutableMapping, Optional

from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.responses import JSONResponse, PlainTextResponse
import socketio

from .storage import CollabStore

LOGGER = logging.getLogger(__name__)

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
router = APIRouter(prefix="/collab", tags=["collaboration"])
_store = CollabStore()
_sessions: MutableMapping[str, str] = {}


def get_store() -> CollabStore:
    return _store


async def _record_presence(agent: str, event: str, metadata: Optional[Mapping[str, Any]] = None) -> None:
    LOGGER.debug("record_presence %s %s", agent, event)
    _store.record_presence(agent, event, metadata)


async def _record_focus(agent: str, payload: Mapping[str, Any]) -> None:
    _store.record_focus(agent, payload.get("file"), payload.get("branch"), payload.get("metadata"))


async def _record_decision(agent: str, payload: Mapping[str, Any]) -> None:
    _store.record_decision(agent, payload.get("subject", "unknown"), payload.get("decision", "unknown"), payload.get("metadata"))


async def _dispatch(event: str, agent: str, payload: Mapping[str, Any]) -> None:
    metadata = dict(payload.get("metadata") or {})
    if event == "focus":
        await _record_presence(agent, "focus", metadata | {"file": payload.get("file"), "branch": payload.get("branch")})
        await _record_focus(agent, payload)
    elif event in {"presence", "help", "voice"}:
        await _record_presence(agent, event, metadata)
    elif event == "decision":
        await _record_presence(agent, event, metadata | {"decision": payload.get("decision")})
        await _record_decision(agent, payload)
    else:
        await _record_presence(agent, event, metadata)
    await sio.emit(event, {"agent": agent, **payload})


@sio.event
async def connect(sid, environ, auth):  # type: ignore[override]
    LOGGER.info("socket connected %s", sid)


@sio.event
async def disconnect(sid):  # type: ignore[override]
    agent = _sessions.pop(sid, None)
    if agent:
        await _record_presence(agent, "disconnect", {})
        await sio.emit("presence", {"agent": agent, "event": "disconnect", "ts": time.time()})


@sio.on("join")
async def handle_join(sid, data):
    agent = (data or {}).get("agent") or f"session:{sid}"
    _sessions[sid] = agent
    await _record_presence(agent, "join", {"ts": data.get("ts") if isinstance(data, Mapping) else time.time()})
    await sio.emit("presence", {"agent": agent, "event": "join", "ts": time.time()}, skip_sid=sid)


@sio.on("presence")
async def handle_presence(sid, payload):
    agent = _sessions.get(sid, (payload or {}).get("agent") or "unknown")
    await _dispatch("presence", agent, payload or {})


@sio.on("focus")
async def handle_focus(sid, payload):
    agent = _sessions.get(sid, (payload or {}).get("agent") or "unknown")
    await _dispatch("focus", agent, payload or {})


@sio.on("help")
async def handle_help(sid, payload):
    agent = _sessions.get(sid, (payload or {}).get("agent") or "unknown")
    await _dispatch("help", agent, payload or {})


@sio.on("voice")
async def handle_voice(sid, payload):
    agent = _sessions.get(sid, (payload or {}).get("agent") or "unknown")
    await _dispatch("voice", agent, payload or {})


@sio.on("decision")
async def handle_decision(sid, payload):
    agent = _sessions.get(sid, (payload or {}).get("agent") or "unknown")
    await _dispatch("decision", agent, payload or {})


@router.post("/events")
async def post_event(payload: Mapping[str, Any]) -> JSONResponse:
    event = payload.get("event")
    body = payload.get("payload") or {}
    agent = body.get("agent") or "api"
    if not event:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "event required")
    await _dispatch(event, agent, body)
    return JSONResponse({"ok": True})


@router.get("/status")
async def collab_status(store: CollabStore = Depends(get_store)) -> Dict[str, Any]:
    return store.snapshot()


@router.get("/status.md")
async def collab_status_markdown(store: CollabStore = Depends(get_store)) -> PlainTextResponse:
    return PlainTextResponse(store.export_markdown(), media_type="text/markdown")


@router.post("/decision")
async def collab_decision(payload: Mapping[str, Any]) -> Dict[str, Any]:
    agent = payload.get("agent") or "api"
    await _dispatch("decision", agent, payload)
    return {"ok": True}


@router.get("/audit")
async def collab_audit(store: CollabStore = Depends(get_store)) -> Dict[str, Any]:
    return {
        "online": store.online_agents(),
        "recent_focus": [
            record.metadata | {"agent": record.agent, "ts": record.ts}
            for record in store.most_recent_focus()
        ],
        "unresolved_decisions": [
            record.metadata | {"agent": record.agent, "state": record.event, "ts": record.ts}
            for record in store.unresolved_decisions()
        ],
    }


def create_app() -> FastAPI:
    fastapi_app = FastAPI(title="Collaboration Presence Bus", version="1.0.0")
    fastapi_app.include_router(router)
    fastapi_app.mount("/collab/socket.io", socketio.ASGIApp(sio, socketio_path="socket.io"))
    return fastapi_app


app = create_app()


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=9000)
