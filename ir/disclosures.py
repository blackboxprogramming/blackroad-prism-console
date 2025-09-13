from __future__ import annotations
from pathlib import Path
from datetime import datetime
import json
import hashlib

from .utils import IR_ARTIFACTS, log_metric

LEDGER = IR_ARTIFACTS / "disclosures.jsonl"


def _append(entry: dict) -> None:
    with LEDGER.open("a") as f:
        f.write(json.dumps(entry) + "\n")
    log_metric("ir_disclosure_logged")


def log_file(channel: str, path: str, user: str) -> None:
    p = Path(path)
    content = p.read_bytes()
    h = hashlib.sha256(content).hexdigest()
    entry = {
        "who": user,
        "when": datetime.utcnow().isoformat(),
        "channel": channel,
        "content_hash": h,
    }
    _append(entry)


def log_content(channel: str, content: str, user: str) -> None:
    h = hashlib.sha256(content.encode()).hexdigest()
    entry = {
        "who": user,
        "when": datetime.utcnow().isoformat(),
        "channel": channel,
        "content_hash": h,
    }
    _append(entry)
