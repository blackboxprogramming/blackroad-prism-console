from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

from . import utils


ALERT_JSON = utils.ARTIFACT_DIR / "sbom_alerts.json"
ALERT_MD = utils.ARTIFACT_DIR / "sbom_alerts.md"


def watch(sbom: Path, cves: Path) -> List[Dict[str, object]]:
    sbom_data = json.loads(sbom.read_text())
    cve_map = json.loads(cves.read_text())
    alerts: List[Dict[str, object]] = []
    for pkg in sbom_data.get("packages", []):
        name = pkg.get("name")
        vulns = cve_map.get(name)
        if vulns:
            alerts.append({"package": name, "version": pkg.get("version"), "cves": vulns})
    utils.write_json(ALERT_JSON, alerts)
    lines = ["| package | cves |", "| --- | --- |"]
    for a in alerts:
        lines.append(f"| {a['package']} | {', '.join(a['cves'])} |")
    ALERT_MD.write_text("\n".join(lines), encoding="utf-8")
    utils.record_metric("sbom_alerts", len(alerts))
    return alerts
