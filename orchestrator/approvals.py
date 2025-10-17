from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Iterable, List

from tools import storage

APPROVALS_PATH = "orchestrator/approvals.jsonl"


@dataclass
class ApprovalRequest:
    id: str
    task_id: str
    requested_by: str
    approver_role: str
    status: str = "pending"
    reason: str | None = None
    decided_by: str | None = None
    decided_at: str | None = None


def _load_all() -> List[ApprovalRequest]:
    entries = storage.read_jsonl(APPROVALS_PATH)
    return [ApprovalRequest(**e) for e in entries]


def _save_all(items: Iterable[ApprovalRequest]) -> None:
    storage.write_text(APPROVALS_PATH, "", from_data=True)  # truncate
    for item in items:
        storage.append_jsonl(APPROVALS_PATH, asdict(item))


def create_approval(task_id: str, requested_by: str, approver_role: str) -> ApprovalRequest:
    items = _load_all()
    next_id = f"A{len(items)+1:04d}"
    req = ApprovalRequest(id=next_id, task_id=task_id, requested_by=requested_by, approver_role=approver_role)
    items.append(req)
    _save_all(items)
    return req


def decide(approval_id: str, decision: str, decided_by: str, reason: str | None = None) -> ApprovalRequest:
    items = _load_all()
    for item in items:
        if item.id == approval_id:
            item.status = decision
            item.decided_by = decided_by
            item.reason = reason
            item.decided_at = datetime.utcnow().isoformat()
            break
    _save_all(items)
    return item


def list_approvals(status: str | None = None) -> List[ApprovalRequest]:
    items = _load_all()
    if status:
        items = [i for i in items if i.status == status]
    return items


def has_approval(task_id: str, roles: Iterable[str]) -> bool:
    items = _load_all()
    for item in items:
        if item.task_id == task_id and item.status == "approved" and item.approver_role in roles:
            return True
    return False
