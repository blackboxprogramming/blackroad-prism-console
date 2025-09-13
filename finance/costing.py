"""Deterministic cost accounting."""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / "artifacts" / "costing" / "ledger.jsonl"


def log(bot: str, user: Optional[str] = None, tenant: Optional[str] = None, cpu_ms: int = 100, storage_bytes: int = 100) -> None:
    credits = cpu_ms * 0.001 + storage_bytes * 0.0001
    entry = {
        "ts": datetime.utcnow().isoformat(),
        "bot": bot,
        "user": user,
        "tenant": tenant,
        "cpu_ms": cpu_ms,
        "storage_bytes": storage_bytes,
        "credits": round(credits, 4),
    }
    storage.write(str(LEDGER), entry)


def report(tenant: Optional[str] = None, user: Optional[str] = None) -> Dict[str, float]:
    data = storage.read(str(LEDGER))
    totals: Dict[str, float] = {}
    for line in data.splitlines():
        rec = json.loads(line)
        if tenant and rec.get("tenant") != tenant:
            continue
        if user and rec.get("user") != user:
            continue
        totals[rec["bot"]] = totals.get(rec["bot"], 0.0) + rec.get("credits", 0.0)
    return totals
