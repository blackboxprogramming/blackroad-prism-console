from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

from .slo import SLO_CATALOG

ARTIFACTS = Path("artifacts/bench")


def _load_summary(path: Path) -> Dict:
    return json.loads(path.read_text()) if path.exists() else {}


def collect() -> List[Dict]:
    results: List[Dict] = []
    for bot_dir in ARTIFACTS.glob("*/summary.json"):
        data = _load_summary(bot_dir)
        bot = str(data.get("name", ""))
        prev = _load_summary(bot_dir.with_name("previous_summary.json"))
        if prev:
            data["previous"] = prev
        data["target"] = SLO_CATALOG.get(bot)
        results.append(data)
    return results


def build_report() -> None:
    rows = collect()
    lines = ["|bot|p50|p95|target_p95|pass|timestamp|", "|---|---|---|---|---|---|"]
    for r in rows:
        slo = r.get("slo", {})
        pass_flag = r.get("pass_p95", True)
        lines.append(
            f"|{r['name']}|{r['p50']}|{r['p95']}|{slo.get('p95_target', '')}|{pass_flag}|{r['timestamp']}|")
    table = "\n".join(lines)
    md_path = ARTIFACTS / "_index.md"
    html_path = ARTIFACTS / "_index.html"
    md_path.write_text(table + "\n", encoding="utf-8")
    html_path.write_text("<pre>\n" + table + "\n</pre>\n", encoding="utf-8")


def gate(fail_on: str = "regressions") -> bool:
    rows = collect()
    failures = []
    regressions = []
    for r in rows:
        slo = r.get("slo", {})
        if r.get("p95", 0) > int(slo.get("p95_target", 0) * 1.1):
            failures.append(r["name"])
        prev = r.get("previous")
        if prev and r.get("p95", 0) > prev.get("p95", 0):
            regressions.append(r["name"])
    if failures or (fail_on == "regressions" and regressions):
        return False
    return True
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
