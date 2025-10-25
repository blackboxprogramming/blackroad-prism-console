"""FastAPI service powering the Agent Lineage Framework."""
from __future__ import annotations

import json
import threading
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Deque, Dict, List, Optional
from uuid import uuid4

import yaml
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from scripts.hf_publish import DEFAULT_NAMESPACE, publish_to_huggingface

APP_TITLE = "BlackRoad Agent Lineage API"
BASE_URL = "/api/agents"

REGISTRY_PATH = Path("registry/lineage.json")
CONFIG_TEMPLATE_PATH = Path("configs/agent_template.yaml")
AGENT_CONFIG_DIR = Path("configs/agents")
ACTIONS_LOG_PATH = Path("logs/agent_actions.log")

MAX_CREATIONS_PER_HOUR = 3
RATE_LIMIT_WINDOW = timedelta(hours=1)

_registry_lock = threading.Lock()
_spawn_window: Dict[str, Deque[datetime]] = defaultdict(deque)

app = FastAPI(title=APP_TITLE)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AgentSpawnRequest(BaseModel):
    """Payload for creating a new agent."""

    name: str = Field(..., min_length=2, max_length=128)
    base_model: str = Field(..., min_length=2, max_length=128)
    domain: str = Field(..., min_length=2, max_length=128)
    description: str = Field(..., min_length=2, max_length=2048)
    parent_agent: Optional[str] = Field(default=None, max_length=128)


class AgentUpdateRequest(BaseModel):
    """Payload for updating an agent."""

    description: Optional[str] = Field(default=None, max_length=2048)
    domain: Optional[str] = Field(default=None, max_length=128)
    status: Optional[str] = Field(default=None, min_length=2, max_length=64)


class AgentRecord(BaseModel):
    """Serialized agent representation returned to clients."""

    id: str
    name: str
    base_model: str
    domain: str
    description: str
    parent_agent: Optional[str]
    created_at: str
    created_by: str
    slug: str
    status: str
    huggingface_space: Optional[str]


def _ensure_bootstrap() -> None:
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    AGENT_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    ACTIONS_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

    if not REGISTRY_PATH.exists():
        REGISTRY_PATH.write_text(json.dumps({"agents": []}, indent=2), encoding="utf-8")

    if not ACTIONS_LOG_PATH.exists():
        ACTIONS_LOG_PATH.touch()

    if not CONFIG_TEMPLATE_PATH.exists():
        raise RuntimeError("Missing configs/agent_template.yaml")


def _load_registry_locked() -> Dict[str, Any]:
    data = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    data.setdefault("agents", [])
    return data


def _write_registry_locked(data: Dict[str, Any]) -> None:
    REGISTRY_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _append_log(action: str, actor: str, agent_id: str, detail: str) -> None:
    timestamp = datetime.now(timezone.utc).isoformat()
    line = f"{timestamp}\t{actor}\t{action}\t{agent_id}\t{detail}\n"
    with ACTIONS_LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(line)


def _slugify(name: str) -> str:
    slug = "".join(ch.lower() if ch.isalnum() or ch == "-" else "-" for ch in name)
    slug = "-".join(filter(None, slug.split("-")))
    return slug or uuid4().hex[:12]


def _render_agent_config(agent: Dict[str, Any], actor: str) -> None:
    template = yaml.safe_load(CONFIG_TEMPLATE_PATH.read_text(encoding="utf-8"))
    template.update(
        {
            "name": agent["name"],
            "agent_id": agent["id"],
            "base_model": agent["base_model"],
            "domain": agent["domain"],
            "description": agent["description"],
            "parent_agent": agent["parent_agent"],
        }
    )
    meta = template.setdefault("metadata", {})
    meta.update({"created_at": agent["created_at"], "created_by": actor, "status": agent["status"]})
    config_path = AGENT_CONFIG_DIR / f"{agent['id']}.yaml"
    config_path.write_text(yaml.safe_dump(template, sort_keys=False), encoding="utf-8")


def _rate_limit(actor: str) -> None:
    now = datetime.now(timezone.utc)
    window = _spawn_window[actor]
    while window and (now - window[0]) > RATE_LIMIT_WINDOW:
        window.popleft()
    if len(window) >= MAX_CREATIONS_PER_HOUR:
        raise HTTPException(status_code=429, detail="Agent spawn rate limit exceeded")
    window.append(now)


def _publish_background(agent: Dict[str, Any]) -> None:
    result = publish_to_huggingface(agent)
    with _registry_lock:
        data = _load_registry_locked()
        for item in data["agents"]:
            if item["id"] == agent["id"]:
                item["huggingface_space"] = result.url
                break
        _write_registry_locked(data)
    _append_log("publish", "system", agent["id"], result.url)


def _actor_from_request(request: Request) -> str:
    header = request.headers.get("x-agent-actor")
    if header:
        return header
    client = getattr(request, "client", None)
    return getattr(client, "host", None) or "anonymous"


@app.on_event("startup")
def on_startup() -> None:
    _ensure_bootstrap()


@app.post(f"{BASE_URL}/spawn", status_code=201)
async def spawn_agent(payload: AgentSpawnRequest, background: BackgroundTasks, request: Request) -> Dict[str, Any]:
    actor = _actor_from_request(request)
    _rate_limit(actor)

    with _registry_lock:
        data = _load_registry_locked()
        if any(agent for agent in data["agents"] if agent["name"].lower() == payload.name.lower()):
            raise HTTPException(status_code=409, detail="Agent name already exists")

        agent_id = str(uuid4())
        slug = _slugify(f"{payload.name}-{agent_id[:8]}")
        created_at = datetime.now(timezone.utc).isoformat()
        agent_record = {
            "id": agent_id,
            "name": payload.name,
            "base_model": payload.base_model,
            "domain": payload.domain,
            "description": payload.description,
            "parent_agent": payload.parent_agent,
            "created_at": created_at,
            "created_by": actor,
            "slug": slug,
            "status": "active",
            "huggingface_space": f"https://huggingface.co/spaces/{DEFAULT_NAMESPACE}/{slug}",
        }
        data["agents"].append(agent_record)
        _write_registry_locked(data)

    _render_agent_config(agent_record, actor)
    _append_log("spawn", actor, agent_record["id"], payload.name)
    background.add_task(_publish_background, agent_record)

    return {
        "message": "Agent created successfully.",
        "agent_id": agent_record["id"],
        "huggingface_space": agent_record["huggingface_space"],
    }


@app.get(f"{BASE_URL}/registry")
async def list_registry() -> Dict[str, Any]:
    with _registry_lock:
        data = _load_registry_locked()
    return data


@app.get(BASE_URL)
async def list_agents() -> Dict[str, List[AgentRecord]]:
    with _registry_lock:
        data = _load_registry_locked()
    agents = [AgentRecord(**agent) for agent in data["agents"]]
    return {"agents": [agent.dict() for agent in agents]}


@app.get(f"{BASE_URL}/{{agent_id}}")
async def get_agent(agent_id: str) -> Dict[str, Any]:
    with _registry_lock:
        data = _load_registry_locked()
    for agent in data["agents"]:
        if agent["id"] == agent_id:
            return agent
    raise HTTPException(status_code=404, detail="Agent not found")


@app.patch(f"{BASE_URL}/{{agent_id}}")
async def update_agent(agent_id: str, payload: AgentUpdateRequest, request: Request) -> Dict[str, Any]:
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No updates supplied")

    actor = _actor_from_request(request)
    updated_agent: Optional[Dict[str, Any]] = None

    with _registry_lock:
        data = _load_registry_locked()
        for agent in data["agents"]:
            if agent["id"] == agent_id:
                agent.update(updates)
                updated_agent = dict(agent)
                _write_registry_locked(data)
                break
        else:
            raise HTTPException(status_code=404, detail="Agent not found")

    if updated_agent:
        _render_agent_config(updated_agent, actor)

    _append_log("update", actor, agent_id, json.dumps(updates))
    return {"message": "Agent updated", "agent": updated_agent}


@app.post(f"{BASE_URL}/{{agent_id}}/revert")
async def revert_agent(agent_id: str, request: Request) -> Dict[str, Any]:
    with _registry_lock:
        data = _load_registry_locked()
        filtered = [agent for agent in data["agents"] if agent["id"] != agent_id]
        if len(filtered) == len(data["agents"]):
            raise HTTPException(status_code=404, detail="Agent not found")
        data["agents"] = filtered
        _write_registry_locked(data)

    config_path = AGENT_CONFIG_DIR / f"{agent_id}.yaml"
    if config_path.exists():
        config_path.unlink()

    _append_log("revert", _actor_from_request(request), agent_id, "removed")
    return {"message": "Agent reverted"}


if __name__ == "__main__":  # pragma: no cover - manual execution helper
    import uvicorn

    uvicorn.run("api.agents:app", host="0.0.0.0", port=8000, reload=True)
