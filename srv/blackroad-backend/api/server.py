"""
Lucidia API Server – WebSocket + REST
Exposes Roadie and Guardian functions via simple endpoints.
"""
from __future__ import annotations

import asyncio
import logging
import os
import threading
from collections.abc import Callable, Generator
from concurrent.futures import Future

from fastapi import Body, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from agent import jobs, store
from agents.guardian import Guardian
from agents.roadie import Roadie

logger = logging.getLogger(__name__)

INTERNAL_TOKEN = os.environ.get("INTERNAL_TOKEN", "change-me")

app = FastAPI(title="Lucidia API")

# Instantiate agents pointing at the memory directory
roadie = Roadie(memory_dir="/srv/blackroad-backend/memory")
guardian = Guardian(memory_dir="/srv/blackroad-backend/memory")


@app.get("/")
def home():
    return {"status": "Lucidia API online"}


@app.get("/search/{query}")
def search(query: str):
    results = roadie.search(query)
    return JSONResponse(content={"results": results})


@app.get("/audit")
def audit():
    result = guardian.verify_integrity()
    return JSONResponse(content={"result": result})


def _start_log_tailer(
    loop: asyncio.AbstractEventLoop,
    log_path: str,
) -> tuple[asyncio.Queue[str | None], Future[None], Callable[[], None]]:
    """Start a background thread that feeds log lines into an asyncio queue."""

    queue: asyncio.Queue[str | None] = asyncio.Queue()
    generator_holder: dict[str, Generator[str, None, None]] = {}
    holder_lock = threading.Lock()
    stop_event = threading.Event()

    def _stop() -> None:
        if stop_event.is_set():
            return
        stop_event.set()
        with holder_lock:
            gen = generator_holder.get("gen")
        if gen is not None:
            try:
                gen.close()
            except Exception:  # pragma: no cover - generator already closed
                pass

    def _tail() -> None:
        gen = jobs.tail_remote_log(log_path)
        with holder_lock:
            generator_holder["gen"] = gen
        try:
            for line in gen:
                if stop_event.is_set():
                    break
                loop.call_soon_threadsafe(queue.put_nowait, line)
        finally:
            _stop()
            loop.call_soon_threadsafe(queue.put_nowait, None)

    tail_future: Future[None] = loop.run_in_executor(None, _tail)

    return queue, tail_future, _stop


@app.websocket("/ws/run")
async def ws_run(websocket: WebSocket):
    token = websocket.headers.get("x-internal-token")
    if token != INTERNAL_TOKEN:
        logger.warning("Rejected /ws/run connection with invalid token")
        await websocket.close(code=4401, reason="unauthorized")
        return

    await websocket.accept()
    jid: int | None = None
    loop = asyncio.get_running_loop()
    tail_queue: asyncio.Queue[str | None] | None = None
    tail_future: Future[None] | None = None
    tail_stop: Callable[[], None] | None = None
    try:
        cmd = await websocket.receive_text()
        jid = store.new_job(cmd)
        await websocket.send_text(f"[[BLACKROAD_JOB_ID:{jid}]]")

        meta = jobs.start_remote_logged(jid=jid, command=cmd)
        logger.info("Started remote job %s with pid %s", jid, meta.get("pid"))
        store.mark_running(
            jid,
            pid=meta.get("pid"),
            log_path=meta.get("log"),
            pidfile=meta.get("pidfile"),
        )
        await websocket.send_text(f"[[BLACKROAD_PID:{meta['pid']}]]")
        await websocket.send_text(f"[[BLACKROAD_LOG:{meta['log']}]]")

        tail_queue, tail_future, tail_stop = _start_log_tailer(loop, meta["log"])

        while True:
            line = await tail_queue.get()
            if line is None:
                break
            store.append(jid, line + "\n")
            await websocket.send_text(line)
            if not jobs.remote_is_running(jid):
                if tail_stop is not None:
                    tail_stop()

        status = "ok" if jobs.remote_is_running(jid) is False else "running"
        store.finish(jid, status)
        await websocket.send_text("[[BLACKROAD_DONE]]")
    except WebSocketDisconnect:
        if jid is not None:
            store.finish(jid, "disconnected")
            logger.info("WebSocket disconnected for job %s", jid)
    except Exception as exc:  # noqa: BLE001 - propagate error to client
        if jid is not None:
            store.finish(jid, f"error: {exc}")
            logger.exception("Job %s errored", jid, exc_info=True)
        await websocket.send_text(f"[error] {exc}")
    finally:
        if tail_stop is not None:
            tail_stop()
        if tail_future is not None:
            try:
                await asyncio.wrap_future(tail_future)
            except Exception:  # pragma: no cover - swallow tail errors on shutdown
                pass
        await websocket.close()


@app.post("/jobs/{jid}/kill")
def jobs_kill(jid: int, payload: dict = Body(default={})):  # noqa: B006 - FastAPI compatible default
    sig = payload.get("signal", "TERM")
    ok = jobs.remote_kill(jid, sig=sig)
    return {"ok": ok, "signal": sig}
