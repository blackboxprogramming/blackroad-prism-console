from __future__ import annotations

import datetime
import json
import re
from pathlib import Path

from fastapi import Body, FastAPI

PROMPT_DIR = Path("codex_prompts/prompts")
PROMPT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Mission Builder API")


def _slugify(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9_-]+", "_", value).strip("_")
    return slug.lower() or "mission"


@app.post("/prompts")
def queue_prompt(
    title: str = Body(...),
    body: str = Body(...),
    infer_agent: bool = Body(default=True),
):
    slug = _slugify(title)
    path = PROMPT_DIR / f"{slug}.yaml"
    path.write_text(body)
    return {"ok": True, "path": str(path), "infer_agent": infer_agent}


@app.post("/schedule")
def schedule_job(title: str = Body(...), hour: int = Body(...)):
    sched = Path("codex_prompts/schedule.json")
    now = datetime.datetime.now().isoformat()
    data = {"title": title, "hour": hour, "created": now}
    sched.write_text(json.dumps(data, indent=2))
    return {"ok": True, "next": f"will trigger {hour}:00 daily"}
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import json
import time
import asyncio
import yaml
from typing import Dict, Any, List

LOG_DIR = Path("codex_logs")
PROMPT_DIR = Path("codex_prompts/prompts")
GRAPH_IMG = LOG_DIR / "math_graph.png"
FEEDBACK = LOG_DIR / "feedback_metrics.json"
ROUTER_WEIGHTS = Path("codex_prompts/router_weights.json")

app = FastAPI(title="Codex Nexus API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


class NewPrompt(BaseModel):
    title: str
    body: str
    infer_agent: bool = True


# --- helpers ---
def read_json(path: Path, default):
    try:
        return json.loads(path.read_text())
    except Exception:
        return default


def list_logs(limit: int = 200) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for p in sorted(LOG_DIR.glob("*.json"))[::-1][:limit]:
        if p.name in {"feedback_metrics.json"}:
            continue
        try:
            item = json.loads(p.read_text())
            item["_file"] = p.name
            out.append(item)
        except Exception:
            pass
    return out


# --- routes ---
@app.get("/health")
def health():
    return {"ok": True, "ts": time.time()}


@app.get("/logs")
def logs(limit: int = 200):
    return {"items": list_logs(limit=limit)}


@app.get("/weights")
def weights():
    return read_json(ROUTER_WEIGHTS, {"weights": {}})


@app.get("/feedback")
def feedback():
    return read_json(FEEDBACK, {"agent_scores": {}})


@app.get("/graph.png")
def graph_png():
    if GRAPH_IMG.exists():
        return FileResponse(GRAPH_IMG)
    return JSONResponse({"error": "graph not found"}, status_code=404)


@app.post("/prompts")
def create_prompt(data: NewPrompt):
    PROMPT_DIR.mkdir(parents=True, exist_ok=True)
    try:
        parsed = yaml.safe_load(data.body)
        is_yaml = isinstance(parsed, dict) and ("prompt" in parsed or "agent" in parsed)
    except Exception:
        is_yaml = False

    if is_yaml:
        content = data.body
    else:
        formatted_body = data.body.replace('\n', '\n  ')
        content = "prompt: |\n  " + formatted_body + "\n"

    if data.infer_agent and "agent:" not in content:
        pass

    fn = f"{data.title.lower().replace(' ', '_')}.yaml"
    path = PROMPT_DIR / fn
    path.write_text(content)
    return {"ok": True, "file": str(path)}


clients: List[WebSocket] = []


@app.websocket("/ws")
async def ws(ws: WebSocket):
    await ws.accept()
    clients.append(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        if ws in clients:
            clients.remove(ws)


@app.on_event("startup")
async def start_pusher():
    async def push_loop():
        last = ""
        while True:
            try:
                payload = {
                    "type": "tick",
                    "weights": read_json(ROUTER_WEIGHTS, {}),
                    "feedback": read_json(FEEDBACK, {}),
                    "latest": list_logs(limit=30),
                    "graph_exists": GRAPH_IMG.exists(),
                }
                msg = json.dumps(payload)
                if msg != last:
                    for c in list(clients):
                        try:
                            await c.send_text(msg)
                        except Exception:
                            try:
                                clients.remove(c)
                            except ValueError:
                                pass
                    last = msg
            except Exception:
                pass
            await asyncio.sleep(5)

    asyncio.create_task(push_loop())
