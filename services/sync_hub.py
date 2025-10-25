"""BlackRoad cross-platform synchronization hub.

This module wires together the FastAPI surface that exposes sync controls and the
Celery workers that actually orchestrate the data exchanges.  The implementation
leans on Redis both as a message broker (Celery) and as a lightweight pub/sub bus
so that other agents can be notified when a sync has started or finished.

The module is intentionally declarative: each platform pair is registered in the
``SYNC_TASKS`` mapping which is then reused by the HTTP endpoints and Celery
scheduler alike.  Adding a new integration therefore only requires dropping a
new entry in that mapping and implementing the task body.
"""

from __future__ import annotations

import json
import os
import socket
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Dict, Mapping, MutableMapping

import redis
from celery import Celery
from celery.schedules import crontab
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

SYNC_SERVICE_NAME = "blackroad_sync_core"
REDIS_URL = os.getenv("SYNC_REDIS_URL", "redis://localhost:6379/0")
LOG_FILE = Path(os.getenv("SYNC_LOG_FILE", "logs/sync_events.log"))
SCHEMA_DIR = Path("schemas/sync_contracts")
CONTEXT_PATH = Path("registry/blackroad_context.json")
PUBSUB_CHANNEL = os.getenv("SYNC_PUBSUB_CHANNEL", "blackroad.sync.events")
DEFAULT_QUEUE = "blackroad_sync"


@dataclass(frozen=True)
class SyncTaskSpec:
    """Declarative definition of a sync task."""

    name: str
    source: str
    target: str
    agent: str
    schedule: str | None = None


SYNC_TASKS: MutableMapping[str, SyncTaskSpec] = {
    "github_to_notion": SyncTaskSpec(
        name="sync.github_to_notion",
        source="GitHub",
        target="Notion",
        agent="Lucidia",
        schedule="*/10 * * * *",
    ),
    "notion_to_slack": SyncTaskSpec(
        name="sync.notion_to_slack",
        source="Notion",
        target="Slack",
        agent="Seraphina",
        schedule="*/5 * * * *",
    ),
    "linear_to_github": SyncTaskSpec(
        name="sync.linear_to_github",
        source="Linear",
        target="GitHub",
        agent="Athena",
        schedule="*/30 * * * *",
    ),
    "huggingface_to_dropbox": SyncTaskSpec(
        name="sync.huggingface_to_dropbox",
        source="Hugging Face",
        target="Dropbox",
        agent="Celeste",
    ),
    "dropbox_to_notion": SyncTaskSpec(
        name="sync.dropbox_to_notion",
        source="Dropbox",
        target="Notion",
        agent="Cicero",
    ),
    "slack_to_linear": SyncTaskSpec(
        name="sync.slack_to_linear",
        source="Slack",
        target="Linear",
        agent="Persephone",
    ),
    "full_refresh": SyncTaskSpec(
        name="sync.full_refresh",
        source="multi",
        target="multi",
        agent="Magnus",
    ),
}


def _initialise_log_file() -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not LOG_FILE.exists():
        LOG_FILE.write_text("", encoding="utf-8")


_initialise_log_file()


def _redis_client() -> redis.Redis:
    return redis.Redis.from_url(REDIS_URL, decode_responses=True)


def _publish_event(event: Mapping[str, Any]) -> None:
    try:
        _redis_client().publish(PUBSUB_CHANNEL, json.dumps(event))
    except redis.RedisError:
        # The sync hub should not crash just because redis is momentarily
        # unavailable.  We still write the log entry so that the event is not
        # lost and rely on monitoring to catch redis outages.
        pass


def _write_log(event: Mapping[str, Any]) -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event) + "\n")


def _record_event(action: str, *, payload: Mapping[str, Any] | None = None) -> None:
    event = {
        "timestamp": datetime.now(tz=UTC).isoformat(),
        "action": action,
        "payload": payload or {},
        "host": socket.gethostname(),
    }
    _write_log(event)
    _publish_event(event)


celery_app = Celery(
    SYNC_SERVICE_NAME,
    broker=REDIS_URL,
    backend=REDIS_URL,
)
celery_app.conf.update(
    task_default_queue=DEFAULT_QUEUE,
    result_expires=3600,
    timezone="UTC",
    task_serializer="json",
    accept_content=["json"],
)


def _parse_schedule(expression: str | None) -> Any:
    if not expression:
        return None
    minute, hour, day_of_month, month_of_year, day_of_week = expression.split()
    return crontab(
        minute=minute,
        hour=hour,
        day_of_month=day_of_month,
        month_of_year=month_of_year,
        day_of_week=day_of_week,
    )


celery_app.conf.beat_schedule = {
    task_id: {
        "task": spec.name,
        "schedule": _parse_schedule(spec.schedule),
    }
    for task_id, spec in SYNC_TASKS.items()
    if spec.schedule
}


class SyncTriggerRequest(BaseModel):
    source: str
    target: str
    agent: str
    payload: Dict[str, Any] | None = None
    task: str | None = Field(
        default=None,
        description="Override task identifier (one of SYNC_TASKS).",
    )

    @field_validator("task")
    @classmethod
    def validate_task(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if value not in SYNC_TASKS:
            raise ValueError(f"Unknown sync task: {value}")
        return value


class SyncStatus(BaseModel):
    scheduled: Dict[str, Any]
    queue_depth: int
    last_events: list[Dict[str, Any]]


def _load_recent_events(limit: int = 10) -> list[Dict[str, Any]]:
    if not LOG_FILE.exists():
        return []
    with LOG_FILE.open("r", encoding="utf-8") as handle:
        lines = handle.readlines()[-limit:]
    events: list[Dict[str, Any]] = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            events.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return events


app = FastAPI(
    title="BlackRoad Sync Hub",
    version="0.1.0",
    description="Cross-platform synchronization orchestration layer",
)


@app.on_event("startup")
def ensure_schema_directory() -> None:
    SCHEMA_DIR.mkdir(parents=True, exist_ok=True)


def _dispatch_task(task_name: str, payload: Mapping[str, Any]) -> str:
    async_result = celery_app.send_task(task_name, kwargs={"payload": dict(payload)})
    _record_event("task_dispatched", payload={"task": task_name, "id": async_result.id})
    return async_result.id


@app.post("/api/sync/trigger", status_code=202)
def trigger_sync(request: SyncTriggerRequest) -> Dict[str, Any]:
    task_key = request.task or next(
        (
            key
            for key, spec in SYNC_TASKS.items()
            if spec.source == request.source and spec.target == request.target and spec.agent == request.agent
        ),
        None,
    )
    if task_key is None:
        raise HTTPException(status_code=404, detail="No matching sync task registered")
    task_name = SYNC_TASKS[task_key].name
    job_id = _dispatch_task(task_name, request.payload or {})
    return {"task": task_key, "job_id": job_id}


@app.get("/api/sync/status", response_model=SyncStatus)
def sync_status() -> SyncStatus:
    try:
        queue_depth = int(_redis_client().llen(DEFAULT_QUEUE))
    except redis.RedisError:
        queue_depth = -1
    scheduled = {
        name: {
            "source": spec.source,
            "target": spec.target,
            "agent": spec.agent,
            "schedule": spec.schedule,
        }
        for name, spec in SYNC_TASKS.items()
        if spec.schedule
    }
    return SyncStatus(
        scheduled=scheduled,
        queue_depth=queue_depth,
        last_events=_load_recent_events(),
    )


@app.post("/api/sync/refresh", status_code=202)
def refresh_context() -> Dict[str, str]:
    job_id = _dispatch_task(SYNC_TASKS["full_refresh"].name, {})
    return {"task": "full_refresh", "job_id": job_id}


def _update_collective_context(snapshot: Mapping[str, Any]) -> None:
    CONTEXT_PATH.parent.mkdir(parents=True, exist_ok=True)
    existing: Dict[str, Any] = {}
    if CONTEXT_PATH.exists():
        try:
            existing = json.loads(CONTEXT_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            existing = {}
    merged = {**existing, **snapshot, "generated_at": datetime.now(tz=UTC).isoformat()}
    CONTEXT_PATH.write_text(json.dumps(merged, indent=2), encoding="utf-8")


def _complete_task(name: str, payload: Mapping[str, Any] | None = None) -> Dict[str, Any]:
    result = {
        "task": name,
        "status": "ok",
        "payload": payload or {},
        "completed_at": datetime.now(tz=UTC).isoformat(),
    }
    _record_event(f"{name}.completed", payload=result)
    return result


@celery_app.task(name="sync.github_to_notion")
def github_to_notion(payload: Mapping[str, Any] | None = None) -> Dict[str, Any]:
    _record_event("sync.github_to_notion.started", payload=payload or {})
    # Placeholder: The real implementation would inspect merged pull requests and
    # create or update Notion pages accordingly.  Here we only log the intent.
    return _complete_task("github_to_notion", payload)


@celery_app.task(name="sync.notion_to_slack")
def notion_to_slack(payload: Mapping[str, Any] | None = None) -> Dict[str, Any]:
    _record_event("sync.notion_to_slack.started", payload=payload or {})
    return _complete_task("notion_to_slack", payload)


@celery_app.task(name="sync.linear_to_github")
def linear_to_github(payload: Mapping[str, Any] | None = None) -> Dict[str, Any]:
    _record_event("sync.linear_to_github.started", payload=payload or {})
    return _complete_task("linear_to_github", payload)


@celery_app.task(name="sync.huggingface_to_dropbox")
def huggingface_to_dropbox(payload: Mapping[str, Any] | None = None) -> Dict[str, Any]:
    _record_event("sync.huggingface_to_dropbox.started", payload=payload or {})
    return _complete_task("huggingface_to_dropbox", payload)


@celery_app.task(name="sync.dropbox_to_notion")
def dropbox_to_notion(payload: Mapping[str, Any] | None = None) -> Dict[str, Any]:
    _record_event("sync.dropbox_to_notion.started", payload=payload or {})
    return _complete_task("dropbox_to_notion", payload)


@celery_app.task(name="sync.slack_to_linear")
def slack_to_linear(payload: Mapping[str, Any] | None = None) -> Dict[str, Any]:
    _record_event("sync.slack_to_linear.started", payload=payload or {})
    return _complete_task("slack_to_linear", payload)


@celery_app.task(name="sync.full_refresh")
def full_refresh(payload: Mapping[str, Any] | None = None) -> Dict[str, Any]:
    _record_event("sync.full_refresh.started", payload=payload or {})
    snapshot = {
        "refresh_initiator": payload.get("initiator") if payload else None,
        "last_full_refresh": datetime.now(tz=UTC).isoformat(),
    }
    _update_collective_context(snapshot)
    return _complete_task("full_refresh", payload)


__all__ = ["app", "celery_app", "SYNC_TASKS", "SYNC_SERVICE_NAME"]
