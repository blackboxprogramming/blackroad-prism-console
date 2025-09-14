from __future__ import annotations

"""Statistical process control utilities and yield tracking.

Measurements and yields are stored as flat JSON lines.  Alerts are logged
into the security operations center (SOC) artifact directory and into the
Lucidia memory log for later analysis.
"""

from dataclasses import dataclass, asdict
from pathlib import Path
import hashlib
import json
from typing import Dict, List

from tools import storage

ROOT = Path(__file__).resolve().parents[2]
ART_DIR = ROOT / "artifacts" / "mfg" / "spc"
SOC_ALERTS = ROOT / "artifacts" / "security" / "soc_alerts.jsonl"
MEMORY_LOG = ROOT / "artifacts" / "lucidia" / "memory.jsonl"


@dataclass
class Sample:
    work_center: str
    value: float

    def to_json(self) -> Dict[str, float]:
        return asdict(self)


def record_sample(work_center: str, value: float) -> None:
    ART_DIR.mkdir(parents=True, exist_ok=True)
    path = ART_DIR / f"{work_center}_samples.jsonl"
    storage.write(str(path), Sample(work_center, value).to_json())
    # hash for audit trail
    digest = hashlib.sha256(str(value).encode("utf-8")).hexdigest()
    storage.write(str(path.with_suffix(path.suffix + ".sha256")), digest)


def xbar_r_chart(work_center: str) -> Dict[str, float]:
    path = ART_DIR / f"{work_center}_samples.jsonl"
    lines = [json.loads(line) for line in storage.read(str(path)).splitlines() if line.strip()]
    values = [l["value"] for l in lines]
    if not values:
        return {"xbar": 0.0, "r": 0.0}
    xbar = sum(values) / len(values)
    r = max(values) - min(values)
    return {"xbar": xbar, "r": r}


def record_yield(work_center: str, product: str, lot: str, passed: int, failed: int, sla: float = 0.95) -> float:
    ART_DIR.mkdir(parents=True, exist_ok=True)
    total = passed + failed
    yield_pct = passed / total if total else 0.0
    entry = {
        "work_center": work_center,
        "product": product,
        "lot": lot,
        "passed": passed,
        "failed": failed,
        "yield": yield_pct,
    }
    path = ART_DIR / "yields.jsonl"
    storage.write(str(path), entry)
    storage.write(
        str(path.with_suffix(path.suffix + ".sha256")),
        hashlib.sha256(json.dumps(entry).encode("utf-8")).hexdigest(),
    )
    if yield_pct < sla:
        msg = {"type": "YIELD_ALERT", "work_center": work_center, "lot": lot, "yield": yield_pct}
        storage.write(str(SOC_ALERTS), msg)
        storage.write(str(MEMORY_LOG), msg)
    return yield_pct

