from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

from tools import artifacts, storage


@dataclass
class CheckResult:
    check: str
    status: str
    latency_ms: int


def _latency(seed: str) -> int:
    return (sum(ord(c) for c in seed) % 50) + 50


def http_stub(service: str) -> CheckResult:
    return CheckResult("http", "ok", _latency(service + "http"))


def db_stub(service: str) -> CheckResult:
    return CheckResult("db", "ok", _latency(service + "db"))


def queue_stub(service: str) -> CheckResult:
    return CheckResult("queue", "ok", _latency(service + "queue"))


def run_checks(service_id: str) -> List[Dict]:
    checks = [http_stub(service_id), db_stub(service_id), queue_stub(service_id)]
    results = [cr.__dict__ for cr in checks]
    out_path = f"artifacts/healthchecks/{service_id}/latest.json"
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    artifacts.validate_and_write(out_path, {"service": service_id, "checks": results}, "schemas/healthcheck.schema.json")
    return results


def summary(service_id: str) -> Dict:
    data = json.loads(storage.read(f"artifacts/healthchecks/{service_id}/latest.json"))
    return data
