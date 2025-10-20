import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

from tools import artifacts, metrics, storage

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = ROOT / "artifacts/marketing"
LAKE = ROOT / "artifacts/lake"
CONTRACTS = ROOT / "contracts/schemas"


@dataclass
class Post:
    id: str
    channel: str
    text: str
    media: Optional[str]
    scheduled_at: str


class IRBlocked(Exception):
    code = "IR_QUIET_PERIOD"


def queue_post(channel: str, text: str, media: Optional[str] = None, scheduled_at: Optional[str] = None) -> Post:
    pid = f"P{int(datetime.now().timestamp())}"
    scheduled = scheduled_at or datetime.utcnow().isoformat()
    post = Post(pid, channel, text, media, scheduled)
    rec = post.__dict__ | {"status": "queued"}
    artifacts.validate_and_write(
        str(ARTIFACTS_DIR / "social_queue.jsonl"),
        rec,
        schema_path=str(CONTRACTS / "social_posts.schema.json"),
    )
    artifacts.validate_and_write(
        str(LAKE / "social_posts.jsonl"),
        rec,
        schema_path=str(CONTRACTS / "social_posts.schema.json"),
    )
    metrics.emit("social_post_queued")
    return post


def run_queue(dry_run: bool = False) -> None:
    if (ARTIFACTS_DIR / "ir_blackout.flag").exists():
        raise IRBlocked("blackout")
    queue_path = ARTIFACTS_DIR / "social_queue.jsonl"
    lines = storage.read(str(queue_path)).splitlines()
    history_path = ARTIFACTS_DIR / "social_history.jsonl"
    for line in lines:
        if not line:
            continue
        rec = json.loads(line)
        rec["status"] = "sent" if not dry_run else "dry-run"
        artifacts.validate_and_write(
            str(history_path),
            rec,
            schema_path=str(CONTRACTS / "social_posts.schema.json"),
        )
        artifacts.validate_and_write(
            str(LAKE / "social_posts.jsonl"),
            rec,
            schema_path=str(CONTRACTS / "social_posts.schema.json"),
        )
    if not dry_run:
        storage.write(str(queue_path), "")
