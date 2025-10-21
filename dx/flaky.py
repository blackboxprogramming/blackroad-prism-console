#
"""Flaky test hunter."""
import json
import subprocess
from pathlib import Path
from typing import Dict

from . import ARTIFACTS, inc_counter
from tools import storage


FLAKY_REPORT = ARTIFACTS / "flaky_report.json"
QUARANTINE_FILE = Path("configs/dx/quarantine.yaml")


def run(pattern: str, n: int) -> Dict[str, float]:
    failures = 0
    for _ in range(n):
        res = subprocess.run(["pytest", pattern], capture_output=True)
        if res.returncode != 0:
            failures += 1
    rate = failures / max(n, 1)
    data = {"pattern": pattern, "runs": n, "failures": failures, "rate": rate}
    storage.write(str(FLAKY_REPORT), data)
    inc_counter("dx_flaky_runs")
    return data


def quarantine_update() -> None:
    data = json.loads(storage.read(str(FLAKY_REPORT)) or "{}")
    if not data or data.get("rate", 0) == 0:
        return
    try:
        import yaml
    except Exception:  # pragma: no cover
        yaml = None
    if yaml is None:
        return
    qdata = yaml.safe_load(Path(QUARANTINE_FILE).read_text()) or []
    if data["pattern"] not in qdata:
        qdata.append(data["pattern"])
        Path(QUARANTINE_FILE).parent.mkdir(parents=True, exist_ok=True)
        Path(QUARANTINE_FILE).write_text(yaml.safe_dump(qdata))
        inc_counter("dx_quarantined")
