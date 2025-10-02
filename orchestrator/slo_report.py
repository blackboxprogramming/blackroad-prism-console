import json
from pathlib import Path
from typing import Dict, List

from tools import storage

from .slo import SLO_CATALOG


def _gather_summaries() -> List[Dict]:
    summaries: List[Dict] = []
    for path in Path("artifacts/bench").glob("*/summary.json"):
        data = json.loads(storage.read(str(path)))
        data["name"] = path.parent.name
        prev = path.parent / "previous_summary.json"
        if prev.exists():
            data["previous"] = json.loads(storage.read(str(prev)))
        summaries.append(data)
    return sorted(summaries, key=lambda item: item["name"])


def build_report() -> Dict[str, List[Dict]]:
    items = _gather_summaries()
    lines = ["| bot | p50 | p95 | target_p95 | pass |", "|---|---|---|---|---|"]
    for it in items:
        slo = SLO_CATALOG.get(it["name"])
        p50 = it.get("p50")
        p95 = it.get("p95")
        target = slo.p95_ms if slo else "na"
        passed = "✅" if slo and p95 <= slo.p95_ms else "❌"
        lines.append(f"| {it['name']} | {p50} | {p95} | {target} | {passed} |")
    md = "\n".join(lines)
    bench_root = Path("artifacts/bench")
    storage.write(str(bench_root / "_index.md"), md)
    storage.write(str(bench_root / "_index.html"), f"<pre>{md}</pre>")
    return {"rows": items}


def gate(fail_on: str = "regressions") -> int:
    """Return 0 if all good, else 1."""
    rc = 0
    for it in _gather_summaries():
        slo = SLO_CATALOG.get(it["name"])
        if not slo:
            continue
        if it.get("p95", 0) > slo.p95_ms * 1.1:
            rc = 1
            continue
        prev = it.get("previous")
        if fail_on == "regressions" and prev and it.get("p95", 0) > prev.get("p95", 0):
            rc = 1
    return rc
