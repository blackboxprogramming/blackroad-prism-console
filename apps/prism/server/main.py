"""FastAPI service powering the BlackRoad Prism console job runner."""

from __future__ import annotations

from typing import List

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from .agent import jobs, store

app = FastAPI(title="BlackRoad Prism Console API")


@app.get("/jobs")
def list_jobs(limit: int = 20) -> List[dict]:
    """Return the most recent jobs."""
    safe_limit = max(1, min(int(limit), 200))
    return store.list_jobs(limit=safe_limit)


@app.get("/jobs/{job_id}")
def get_job(job_id: int) -> dict:
    """Return details for a specific job."""
    job = store.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")
    return job


@app.websocket("/ws/run")
async def ws_run(websocket: WebSocket) -> None:
    await websocket.accept()
    jid: int | None = None
    try:
        cmd = await websocket.receive_text()
        if not cmd.strip():
            await websocket.send_text("[error] command required")
            return
        jid = store.new_job(cmd)
        await websocket.send_text(f"[[BLACKROAD_JOB_ID:{jid}]]")

        for line in jobs.run_remote_stream(command=cmd):
            payload = line if line.endswith("\n") else f"{line}\n"
            store.append(jid, payload)
            await websocket.send_text(line)

        store.finish(jid, "ok")
        await websocket.send_text("[[BLACKROAD_DONE]]")
    except WebSocketDisconnect:
        if jid is not None:
            store.finish(jid, "disconnected")
    except Exception as exc:  # noqa: BLE001
        if jid is not None:
            store.finish(jid, f"error: {exc}")
        if websocket.application_state == WebSocketState.CONNECTED:
            await websocket.send_text(f"[error] {exc}")
    finally:
        if websocket.application_state == WebSocketState.CONNECTED:
            await websocket.close()
