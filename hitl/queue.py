import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Literal, Optional

from pydantic import BaseModel

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
QUEUE_FILE = Path(os.environ.get("HITL_QUEUE_FILE", ROOT / "hitl" / "queue.jsonl"))
ID_FILE = Path(os.environ.get("HITL_ID_FILE", ROOT / "hitl" / "last_id.txt"))


class ReviewItem(BaseModel):
    id: str
    task_id: str
    artifact_path: str
    type: Literal["finance", "security", "release", "other"]
    status: Literal["pending", "approved", "changes_requested"]
    requested_by: str
    reviewers: List[str]
    notes: List[str]
    created_at: str
    updated_at: str


def _next_id() -> str:
    last = int(storage.read(str(ID_FILE)) or 0)
    new = last + 1
    storage.write(str(ID_FILE), str(new))
    return f"H{new:03d}"


def enqueue(task_id: str, artifact_path: str, type: str, requested_by: str, reviewers: List[str]) -> ReviewItem:
    now = datetime.utcnow().isoformat()
    item = ReviewItem(
        id=_next_id(),
        task_id=task_id,
        artifact_path=artifact_path,
        type=type,  # type: ignore[arg-type]
        status="pending",
        requested_by=requested_by,
        reviewers=reviewers,
        notes=[],
        created_at=now,
        updated_at=now,
    )
    storage.write(str(QUEUE_FILE), item.model_dump(mode="json"))
    return item


def _load_items() -> dict:
    content = storage.read(str(QUEUE_FILE))
    items = {}
    if content:
        for line in content.splitlines():
            if not line.strip():
                continue
            data = json.loads(line)
            items[data["id"]] = ReviewItem(**data)
    return items


def list_items(status: Optional[str] = None) -> List[ReviewItem]:
    items = list(_load_items().values())
    if status:
        items = [i for i in items if i.status == status]
    return items


def _append(item: ReviewItem) -> None:
    item.updated_at = datetime.utcnow().isoformat()
    storage.write(str(QUEUE_FILE), item.model_dump(mode="json"))


def approve(id: str, reviewer: str, note: str) -> ReviewItem:
    items = _load_items()
    item = items.get(id)
    if not item:
        raise ValueError("not-found")
    item.status = "approved"
    item.reviewers = [reviewer]
    item.notes.append(note)
    _append(item)
    return item


def request_changes(id: str, reviewer: str, note: str) -> ReviewItem:
    items = _load_items()
    item = items.get(id)
    if not item:
        raise ValueError("not-found")
    item.status = "changes_requested"
    item.reviewers = [reviewer]
    item.notes.append(note)
    _append(item)
    return item

