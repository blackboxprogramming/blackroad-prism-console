"""
Lucidia API Server – WebSocket + REST
Exposes Roadie and Guardian functions via simple endpoints.
"""
from __future__ import annotations

import json
from typing import Any, Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from agent import jobs, store, telemetry
from agents.guardian import Guardian
from agents.roadie import Roadie

app = FastAPI(title="Lucidia API")

# Instantiate agents pointing at the memory directory
roadie = Roadie(memory_dir="/srv/blackroad-backend/memory")
guardian = Guardian(memory_dir="/srv/blackroad-backend/memory")


@app.get("/")
def home() -> Dict[str, str]:
    return {"status": "Lucidia API online"}


@app.get("/search/{query}")
def search(query: str) -> JSONResponse:
    results = roadie.search(query)
    return JSONResponse(content={"results": results})


@app.get("/audit")
def audit() -> JSONResponse:
    result = guardian.verify_integrity()
    return JSONResponse(content={"result": result})


@app.get("/api/timeline")
def api_timeline() -> Any:
    return telemetry.timeline()


@app.get("/api/tasks")
def api_tasks() -> Any:
    return telemetry.tasks()


@app.get("/api/commits")
def api_commits() -> Any:
    return telemetry.commits()


@app.get("/api/state")
def api_state() -> Dict[str, Any]:
    return telemetry.state()


@app.websocket("/ws")
async def ws_dashboard(websocket: WebSocket) -> None:
    await websocket.accept()
    stream = telemetry.stream()
    try:
        async for message in stream:
            await websocket.send_text(json.dumps(message))
    except WebSocketDisconnect:
        pass
    finally:
        try:
            await stream.aclose()  # type: ignore[attr-defined]
        except Exception:
            pass
        try:
            await websocket.close()
        except Exception:
            pass


@app.websocket("/ws/run")
async def ws_run(websocket: WebSocket) -> None:
    await websocket.accept()
    jid = None
    try:
        cmd = await websocket.receive_text()
        jid = store.new_job(cmd)
        telemetry.record_activity(f"Job #{jid} queued", cmd)
        await websocket.send_text(f"[[BLACKROAD_JOB_ID:{jid}]]")
        for line in jobs.run_remote_stream(command=cmd):
            store.append(jid, line + "\n")
            await websocket.send_text(line)
        store.finish(jid, "ok")
        telemetry.record_activity(f"Job #{jid} complete", "Job finished successfully")
        await websocket.send_text("[[BLACKROAD_DONE]]")
    except WebSocketDisconnect:
        if jid is not None:
            store.finish(jid, "disconnected")
            telemetry.record_activity(f"Job #{jid} disconnected", "Client closed stream")
    except Exception as exc:  # pragma: no cover - defensive
        if jid is not None:
            store.finish(jid, f"error: {exc}")
            telemetry.record_activity(f"Job #{jid} error", str(exc))
        await websocket.send_text(f"[error] {exc}")
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


@app.get("/jobs")
def jobs_list() -> Dict[str, Any]:
    return {"jobs": store.list_jobs(50)}


@app.get("/jobs/{jid}")
def jobs_get(jid: int) -> Dict[str, Any]:
    job = store.get_job(jid)
    return job or {"error": "not found"}
