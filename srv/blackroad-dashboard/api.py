"""FastAPI application providing the Prism dashboard job controls."""

from __future__ import annotations

import asyncio
import threading
from typing import Optional

from fastapi import Body, FastAPI, WebSocket, WebSocketDisconnect

from agent import jobs, store

app = FastAPI(title="BlackRoad Dashboard API")


@app.websocket("/ws/run")
async def ws_run(websocket: WebSocket) -> None:
    await websocket.accept()
    jid: Optional[int] = None
    tail_thread: Optional[threading.Thread] = None
    queue: asyncio.Queue[Optional[str]] = asyncio.Queue()

    try:
        cmd = await websocket.receive_text()
        jid = store.new_job(cmd)
        await websocket.send_text(f"[[BLACKROAD_JOB_ID:{jid}]]")

        meta = jobs.start_remote_logged(jid=jid, command=cmd)
        await websocket.send_text(f"[[BLACKROAD_PID:{meta['pid']}]]")
        await websocket.send_text(f"[[BLACKROAD_LOG:{meta['log']}]]")

        loop = asyncio.get_running_loop()

        def _push(item: Optional[str]) -> None:
            asyncio.run_coroutine_threadsafe(queue.put(item), loop)

        def _tail() -> None:
            try:
                for line in jobs.tail_remote_log(meta["log"]):
                    _push(line)
                    if jid is not None and not jobs.remote_is_running(jid):
                        break
            except Exception as exc:  # pragma: no cover - defensive guard
                _push(f"[error] {exc}")
            finally:
                _push(None)

        tail_thread = threading.Thread(target=_tail, name=f"job-tail-{jid}", daemon=True)
        tail_thread.start()

        while True:
            line = await queue.get()
            if line is None:
                break
            if jid is not None:
                store.append(jid, line + "\n")
            await websocket.send_text(line)

        is_running = jobs.remote_is_running(jid) if jid is not None else False
        status = "running" if is_running else "ok"
        if jid is not None:
            store.finish(jid, status)
        await websocket.send_text("[[BLACKROAD_DONE]]")

    except WebSocketDisconnect:
        if jid is not None:
            store.finish(jid, "disconnected")
    except Exception as exc:
        if jid is not None:
            store.finish(jid, f"error: {exc}")
        await websocket.send_text(f"[error] {exc}")
    finally:
        if tail_thread and tail_thread.is_alive():
            tail_thread.join(timeout=0.2)
        try:
            await websocket.close()
        except RuntimeError:
            # WebSocket already closed.
            pass


@app.post("/jobs/{jid}/kill")
async def jobs_kill(jid: int, payload: dict = Body(default={})) -> dict[str, object]:
    sig = payload.get("signal", "TERM")
    ok = jobs.remote_kill(jid, sig=sig)
    return {"ok": ok, "signal": sig}
