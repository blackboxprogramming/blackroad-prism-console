from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List

import yaml
import metrics


@dataclass
class Finding:
    code: str
    message: str


def assess(artifact_path: str | Path, config_yaml: str | Path) -> List[Finding]:
    text = Path(artifact_path).read_text(encoding="utf-8")
    cfg: Dict[str, Any] = yaml.safe_load(Path(config_yaml).read_text(encoding="utf-8"))
    findings: List[Finding] = []

    for seg in cfg.get("required_segments", []):
        if seg not in text:
            findings.append(Finding("REP_GAP", f"{seg} missing"))

    fairness = cfg.get("fairness") or {}
    groups = fairness.get("groups", {})
    if groups:
        vals = list(groups.values())
        threshold = fairness.get("threshold", 0)
        if max(vals) - min(vals) > threshold:
            findings.append(Finding("FAIR_DELTA", "fairness delta above threshold"))

    for field in cfg.get("required_fields", []):
        token = f"{field}:"
        if token not in text:
            findings.append(Finding("INCOMPLETE", f"{field} missing"))
        elif f"{token} TBD" in text:
            findings.append(Finding("INCOMPLETE", f"{field} incomplete"))

    metrics.inc("quality_findings", len(findings))
    return findings
