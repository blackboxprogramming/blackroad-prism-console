from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

from tools import artifacts, metrics, storage


def _load_catalog() -> List[Dict]:
    raw = storage.read("artifacts/services/catalog.json")
    return json.loads(raw) if raw else []


def _load_health(service: str) -> Dict:
    raw = storage.read(f"artifacts/healthchecks/{service}/latest.json")
    return json.loads(raw) if raw else {"checks": []}


def build() -> None:
    services = _load_catalog()
    lines = ["# Service Status", ""]
    warnings: List[str] = []
    if not services:
        warnings.append(
            "⚠️ No services were found in the catalog. The status report is incomplete."
        )

    lines.append("| Service | Availability | Last Check |")
    lines.append("|---|---|---|")

    missing_checks: List[str] = []
    for s in services:
        hc = _load_health(s["id"])
        checks = hc.get("checks", [])
        if not checks:
            missing_checks.append(s["id"])
            avail = "N/A"
            summary = "no checks available"
        else:
            ok = sum(1 for c in checks if c.get("status") == "ok")
            total = len(checks)
            avail = f"{(ok/total)*100:.1f}%"
            summary = f"{ok}/{total} checks ok"
        lines.append(f"| {s['id']} | {avail} | {summary} |")

    if missing_checks:
        warnings.append(
            "⚠️ The following services have no recorded health checks: "
            + ", ".join(sorted(missing_checks))
            + "."
        )

    if warnings:
        lines.append("")
        for note in warnings:
            lines.append(f"> {note}")
    md = "\n".join(lines)
    out_md = "artifacts/status/index.md"
    artifacts.validate_and_write(out_md, md, "schemas/status.schema.json")
    html = ["<html><head><style>body{font-family:sans-serif}</style></head><body>"]
    html.append(md.replace("\n", "<br/>"))
    html.append("</body></html>")
    artifacts.validate_and_write("artifacts/status/index.html", "".join(html), "schemas/status.schema.json")
    metrics.emit("status_builds", 1)
