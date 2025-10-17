from __future__ import annotations

from datetime import datetime
from typing import Any

from tools import storage
from security import signing
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from security.rbac import User

LOG_PATH = "orchestrator/memory.jsonl"


def log_event(action: str, *, ok: bool, user: User, extra: dict[str, Any] | None = None) -> None:
    payload: dict[str, Any] = {
        "ts": datetime.utcnow().isoformat(),
        "action": action,
        "ok": ok,
        "actor_user_id": user.id,
        "actor_roles": user.roles,
        "ip": "local",
    }
    if extra:
        payload.update(extra)
    sig = signing.sign(payload)
    record = payload | {"sig": sig}
    storage.append_jsonl(LOG_PATH, record)


def verify_log() -> list[int]:
    bad_lines: list[int] = []
    entries = storage.read_jsonl(LOG_PATH)
    for idx, entry in enumerate(entries, 1):
        sig = entry.get("sig", "")
        payload = {k: v for k, v in entry.items() if k != "sig"}
        if not signing.verify(payload, sig):
            bad_lines.append(idx)
    return bad_lines
