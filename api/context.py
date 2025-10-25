"""Collective awareness API for the BlackRoad ecosystem."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field

CONTEXT_PATH = Path("registry/blackroad_context.json")
REFRESH_INTERVAL_MINUTES = 15


class RepoEntry(BaseModel):
    name: str
    url: str
    purpose: str
    last_commit: Optional[str] = Field(default=None, description="Latest commit summary")


class ProjectEntry(BaseModel):
    id: str
    title: str
    status: str
    owner: str


class CommitSummary(BaseModel):
    repo: str
    author: str
    message: str
    sha: str
    committed_at: str


class NotionSpace(BaseModel):
    id: str
    title: str
    url: str


class LinearIssue(BaseModel):
    id: str
    title: str
    status: str
    assignee: Optional[str] = None


class CollectiveContext(BaseModel):
    repo_list: list[RepoEntry]
    active_projects: list[ProjectEntry]
    last_commit_summary: list[CommitSummary]
    notion_spaces: list[NotionSpace]
    linear_issues_summary: list[LinearIssue]
    generated_at: str
    refresh_interval_minutes: int = Field(default=REFRESH_INTERVAL_MINUTES)


class ContextUpdate(BaseModel):
    repo_list: Optional[list[RepoEntry]] = None
    active_projects: Optional[list[ProjectEntry]] = None
    last_commit_summary: Optional[list[CommitSummary]] = None
    notion_spaces: Optional[list[NotionSpace]] = None
    linear_issues_summary: Optional[list[LinearIssue]] = None


router = APIRouter(prefix="/api/context", tags=["context"])


def _load_context() -> Dict[str, Any]:
    if not CONTEXT_PATH.exists():
        raise HTTPException(status_code=404, detail="Collective context has not been generated yet")
    try:
        return json.loads(CONTEXT_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail="Context file is invalid JSON") from exc


@router.get("/", response_model=CollectiveContext)
def get_context() -> CollectiveContext:
    payload = _load_context()
    payload.setdefault("refresh_interval_minutes", REFRESH_INTERVAL_MINUTES)
    payload.setdefault("generated_at", datetime.now(tz=UTC).isoformat())
    return CollectiveContext(**payload)


@router.post("/refresh", response_model=CollectiveContext)
def refresh_context(update: ContextUpdate) -> CollectiveContext:
    payload = _load_context()
    update_payload = update.model_dump(exclude_none=True)
    payload.update(update_payload)
    payload["generated_at"] = datetime.now(tz=UTC).isoformat()
    CONTEXT_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONTEXT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    payload.setdefault("refresh_interval_minutes", REFRESH_INTERVAL_MINUTES)
    return CollectiveContext(**payload)


def create_app() -> FastAPI:
    app = FastAPI(title="BlackRoad Collective Context", version="0.1.0")
    app.include_router(router)
    return app


__all__ = [
    "CollectiveContext",
    "ContextUpdate",
    "create_app",
    "router",
]
