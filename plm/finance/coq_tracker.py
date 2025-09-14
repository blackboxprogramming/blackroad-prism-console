from __future__ import annotations

"""Cost of quality tracking utilities.

Costs are categorised into prevention, appraisal, internal failure and
external failure.  Entries are stored as JSON lines under
``artifacts/plm/coq`` and can be rolled up for dashboard reporting.
"""

from dataclasses import dataclass, asdict
from pathlib import Path
import hashlib
import json
from typing import Dict

from tools import storage

ROOT = Path(__file__).resolve().parents[2]
ART_DIR = ROOT / "artifacts" / "plm" / "coq"


@dataclass
class CostEntry:
    category: str  # prevention|appraisal|internal_failure|external_failure
    amount: float
    note: str = ""

    def to_json(self) -> Dict[str, str]:
        return asdict(self)


def record_cost(category: str, amount: float, note: str = "") -> None:
    ART_DIR.mkdir(parents=True, exist_ok=True)
    entry = CostEntry(category=category, amount=amount, note=note).to_json()
    path = ART_DIR / "costs.jsonl"
    storage.write(str(path), entry)
    storage.write(
        str(path.with_suffix(path.suffix + ".sha256")),
        hashlib.sha256(json.dumps(entry).encode("utf-8")).hexdigest(),
    )


def rollup() -> Dict[str, float]:
    path = ART_DIR / "costs.jsonl"
    totals: Dict[str, float] = {
        "prevention": 0.0,
        "appraisal": 0.0,
        "internal_failure": 0.0,
        "external_failure": 0.0,
    }
    for line in storage.read(str(path)).splitlines():
        if not line.strip():
            continue
        entry = json.loads(line)
        totals[entry["category"]] += float(entry["amount"])
    totals["total"] = sum(totals.values())
    return totals

