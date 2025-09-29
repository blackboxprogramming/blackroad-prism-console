"""
Lucidia API Server – WebSocket + REST
Exposes Roadie and Guardian functions via simple endpoints.
"""
from fastapi import Body, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from agent import jobs, store
from agents.guardian import Guardian
from agents.roadie import Roadie

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


@app.websocket("/ws/run")
async def ws_run(websocket: WebSocket):
    await websocket.accept()
    jid: int | None = None
    try:
        cmd = await websocket.receive_text()
        jid = store.new_job(cmd)
        await websocket.send_text(f"[[BLACKROAD_JOB_ID:{jid}]]")

        meta = jobs.start_remote_logged(jid=jid, command=cmd)
        store.mark_running(
            jid,
            pid=meta.get("pid"),
            log_path=meta.get("log"),
            pidfile=meta.get("pidfile"),
        )
        await websocket.send_text(f"[[BLACKROAD_PID:{meta['pid']}]]")
        await websocket.send_text(f"[[BLACKROAD_LOG:{meta['log']}]]")

        for line in jobs.tail_remote_log(meta["log"]):
            store.append(jid, line + "\n")
            await websocket.send_text(line)
            if not jobs.remote_is_running(jid):
                break

        status = "ok" if jobs.remote_is_running(jid) is False else "running"
        store.finish(jid, status)
        await websocket.send_text("[[BLACKROAD_DONE]]")
    except WebSocketDisconnect:
        if jid is not None:
            store.finish(jid, "disconnected")
    except Exception as exc:  # noqa: BLE001 - propagate error to client
        if jid is not None:
            store.finish(jid, f"error: {exc}")
        await websocket.send_text(f"[error] {exc}")
    finally:
        await websocket.close()


@app.post("/jobs/{jid}/kill")
def jobs_kill(jid: int, payload: dict = Body(default={})):  # noqa: B006 - FastAPI compatible default
    sig = payload.get("signal", "TERM")
    ok = jobs.remote_kill(jid, sig=sig)
    return {"ok": ok, "signal": sig}
