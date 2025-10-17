"""FastAPI application exposing the Jetson job runner."""

from __future__ import annotations

import asyncio
import json
import shlex
import subprocess
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Response, WebSocket, WebSocketDisconnect

from agent import _host_user
from agent import jobs as job_runner
from agent import store

app = FastAPI(title="BlackRoad Dashboard")


@app.get("/jobs")
def jobs_list(limit: int = 50) -> Dict[str, Any]:
    return {"jobs": store.list_jobs(limit)}


@app.get("/jobs/{job_id}")
def jobs_get(job_id: int) -> Dict[str, Any]:
    try:
        return store.get_job(job_id)
    except KeyError as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=404, detail="job not found") from exc


@app.get("/jobs/{jid}/download")
def jobs_download(jid: int) -> Response:
    log_path = f"/tmp/blackroad_job_{jid}.log"
    host, user = _host_user()
    try:
        out = subprocess.check_output(
            ["ssh", f"{user}@{host}", "bash", "-lc", f"cat {shlex.quote(log_path)}"],
            text=True,
        )
    except subprocess.CalledProcessError:
        out = ""
    return Response(content=out, media_type="text/plain")


async def _stream_log(websocket: WebSocket, jid: int, log_path: str) -> None:
    host, user = _host_user()
    tail_cmd = [
        "ssh",
        f"{user}@{host}",
        "bash",
        "-lc",
        f"touch {shlex.quote(log_path)}; tail -n +1 -F {shlex.quote(log_path)}",
    ]
    proc = await asyncio.create_subprocess_exec(
        *tail_cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
    )
    try:
        while True:
            line = await proc.stdout.readline()
            if not line:
                if proc.returncode is not None:
                    break
                exit_code = job_runner.remote_exit_code(jid, host=host, user=user)
                if exit_code is not None:
                    proc.terminate()
                    try:
                        await asyncio.wait_for(proc.wait(), timeout=1)
                    except asyncio.TimeoutError:
                        proc.kill()
                        await proc.wait()
                    break
                await asyncio.sleep(0.2)
                continue
            text = line.decode(errors="replace")
            await websocket.send_text(text)
            store.append_output(jid, text)
    finally:
        if proc.returncode is None:
            proc.terminate()
            try:
                await asyncio.wait_for(proc.wait(), timeout=1)
            except asyncio.TimeoutError:
                proc.kill()
                await proc.wait()


@app.websocket("/ws/run")
async def ws_run(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        payload = await websocket.receive_text()
    except WebSocketDisconnect:
        return

    cmd: str
    try:
        data = json.loads(payload)
        cmd = data.get("cmd") or data.get("command") or ""
    except json.JSONDecodeError:
        cmd = payload

    cmd = (cmd or "").strip()
    if not cmd:
        await websocket.send_text("[[BLACKROAD_ERROR:missing command]]")
        await websocket.close()
        return

    jid = store.create_job(cmd)
    await websocket.send_text(f"[[BLACKROAD_JOB_ID:{jid}]]")

    try:
        meta = job_runner.start_remote_logged(jid=jid, command=cmd)
    except Exception as exc:  # pragma: no cover - remote failure path
        store.finish(jid, "failed", exit_code=None)
        await websocket.send_text("[[BLACKROAD_EXIT:NA]]")
        await websocket.send_text("[[BLACKROAD_DONE]]")
        raise exc

    try:
        await _stream_log(websocket, jid, meta["log"])
    except WebSocketDisconnect:
        await asyncio.sleep(0.2)
    except Exception:
        store.append_output(jid, "\n[log stream error]\n")
        raise

    exit_code = job_runner.remote_exit_code(jid)
    status = "ok" if exit_code == 0 else ("failed" if exit_code is not None else "unknown")
    store.finish(jid, status, exit_code)
    await websocket.send_text(
        f"[[BLACKROAD_EXIT:{exit_code if exit_code is not None else 'NA'}]]"
    )
    await websocket.send_text("[[BLACKROAD_DONE]]")
