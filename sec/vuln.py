from __future__ import annotations

import csv
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List

from . import utils
from .assets import Asset, list_assets


@dataclass
class Vuln:
    asset_id: str
    cve: str
    severity: str
    age_days: int
    fix_available: str
    priority: float | None = None


VULN_FILE = utils.ARTIFACT_DIR / "vulns.json"
BACKLOG_JSON = utils.ARTIFACT_DIR / "vuln_backlog.json"
BACKLOG_MD = utils.ARTIFACT_DIR / "vuln_backlog.md"


SEVERITY_SCORE = {"low": 1, "medium": 2, "high": 3, "critical": 4}
CRIT_SCORE = {"low": 1, "medium": 2, "high": 3, "critical": 4}


def import_csv(path: Path) -> List[Vuln]:
    vulns: List[Vuln] = []
    with path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            vulns.append(
                Vuln(
                    asset_id=row["asset_id"],
                    cve=row["cve"],
                    severity=row["severity"],
                    age_days=int(row["age_days"]),
                    fix_available=row["fix_available"],
                )
            )
    utils.write_json(VULN_FILE, [asdict(v) for v in vulns])
    return vulns


def _asset_map() -> dict[str, Asset]:
    try:
        assets = list_assets()
    except FileNotFoundError:
        return {}
    return {a.id: a for a in assets}


def prioritize(top: int = 50) -> List[Vuln]:
    vulns = [Vuln(**v) for v in utils.read_json(VULN_FILE)]
    assets = _asset_map()
    for v in vulns:
        sev = SEVERITY_SCORE.get(v.severity, 1)
        crit = CRIT_SCORE.get(assets.get(v.asset_id, Asset(v.asset_id, '', '', 'low', [])).criticality, 1)
        age = v.age_days / 30
        exposure = 1 if v.fix_available.lower() == "yes" else 0
        v.priority = round(sev + crit + age + exposure, 2)
    vulns.sort(key=lambda x: x.priority or 0, reverse=True)
    top_vulns = vulns[:top]
    utils.write_json(BACKLOG_JSON, [asdict(v) for v in top_vulns])
    lines = ["| asset | cve | priority |", "| --- | --- | --- |"]
    for v in top_vulns:
        lines.append(f"| {v.asset_id} | {v.cve} | {v.priority} |")
    BACKLOG_MD.write_text("\n".join(lines), encoding="utf-8")
    utils.record_metric("sec_vuln_prioritized", len(top_vulns))
    return top_vulns
