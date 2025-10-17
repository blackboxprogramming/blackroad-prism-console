from __future__ import annotations
import hashlib
from datetime import datetime
from pathlib import Path
from tools import storage
from .kpi_sot import IR_ARTIFACTS
from .utils import log_metric


def _ledger_path() -> Path:
    return IR_ARTIFACTS / "disclosures.jsonl"


def log_disclosure(kind: str, path: str, user: str) -> dict:
    content = Path(path).read_bytes()
    digest = hashlib.sha256(content).hexdigest()
    entry = {
        "type": kind,
        "path": path,
        "who": user,
        "when": datetime.utcnow().isoformat(),
        "content_hash": digest,
    }
    storage.write(str(_ledger_path()), entry)
    log_metric("ir_disclosure_logged")
    return entry
