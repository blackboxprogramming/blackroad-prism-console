from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Dict

from orchestrator import metrics
from tools import storage

MEMORY_PATH = Path("orchestrator/memory.jsonl")
LINEAGE_PATH = Path("orchestrator/lineage.jsonl")
ART_PATH = Path("artifacts/observability")


def _read_memory() -> list[Dict]:
    entries = []
    if MEMORY_PATH.exists():
        for line in storage.read(str(MEMORY_PATH)).splitlines():
            if not line.strip():
                continue
            entries.append(json.loads(line))
    return entries


def _lineage_coverage() -> int:
    if not LINEAGE_PATH.exists():
        return 0
    return sum(1 for _ in storage.read(str(LINEAGE_PATH)).splitlines() if _)


def generate() -> Dict:
    mem = _read_memory()
    tasks: Counter[str] = Counter()
    success = 0
    for rec in mem:
        bot = str(rec.get("bot", ""))
        tasks[bot] += 1
        if rec.get("response", {}).get("ok"):
            success += 1
    total = sum(tasks.values())
    success_rate = success / total if total else 0

    metrics_data = metrics.read()
    violations = {
        k.replace("policy_violation_", ""): v
        for k, v in metrics_data.get("counters", {}).items()
        if k.startswith("policy_violation_")
    }
    report = {
        "tasks_per_bot": dict(tasks),
        "success_rate": success_rate,
        "redactions": metrics_data.get("counters", {}).get("redactions_applied", 0),
        "lineage_traces": _lineage_coverage(),
        "policy_violations": violations,
    }
    return report


def _write(path: Path, content: str) -> None:
    storage.write(str(path), content)


def write_report() -> Dict:
    data = generate()
    ART_PATH.mkdir(parents=True, exist_ok=True)

    md_lines = ["# Observability Report"]
    md_lines.append(f"Success rate: {data['success_rate']:.2%}")
    md_lines.append("## Tasks per bot")
    for bot, cnt in data["tasks_per_bot"].items():
        md_lines.append(f"- {bot}: {cnt}")
    md_lines.append("## Policy violations")
    for vio, cnt in data["policy_violations"].items():
        md_lines.append(f"- {vio}: {cnt}")
    md_lines.append(f"Redactions applied: {data['redactions']}")
    md_lines.append(f"Lineage traces: {data['lineage_traces']}")
    md = "\n".join(md_lines)
    _write(ART_PATH / "report.md", md)

    html = [
        "<html><head><style>body{font-family:sans-serif}</style></head><body>",
        "<h1>Observability Report</h1>",
        f"<p>Success rate: {data['success_rate']:.2%}</p>",
        "<h2>Tasks per bot</h2>",
        "<ul>",
    ]
    for bot, cnt in data["tasks_per_bot"].items():
        html.append(f"<li>{bot}: {cnt}</li>")
    html.append("</ul><h2>Policy violations</h2><ul>")
    for vio, cnt in data["policy_violations"].items():
        html.append(f"<li>{vio}: {cnt}</li>")
    html.append(
        f"</ul><p>Redactions applied: {data['redactions']}<br/>Lineage traces: {data['lineage_traces']}</p>"
    )
    html.append("</body></html>")
    _write(ART_PATH / "report.html", "".join(html))
    return data
