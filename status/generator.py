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
    lines.append("| Service | Availability | Last Check |")
    lines.append("|---|---|---|")
    for s in services:
        hc = _load_health(s["id"]) 
        ok = sum(1 for c in hc.get("checks", []) if c["status"] == "ok")
        total = len(hc.get("checks", [])) or 1
        avail = f"{(ok/total)*100:.1f}%"
        lines.append(f"| {s['id']} | {avail} | {ok}/{total} checks ok |")
    md = "\n".join(lines)
    out_md = "artifacts/status/index.md"
    artifacts.validate_and_write(out_md, md, "schemas/status.schema.json")
    html = ["<html><head><style>body{font-family:sans-serif}</style></head><body>"]
    html.append(md.replace("\n", "<br/>"))
    html.append("</body></html>")
    artifacts.validate_and_write("artifacts/status/index.html", "".join(html), "schemas/status.schema.json")
    metrics.emit("status_builds", 1)
