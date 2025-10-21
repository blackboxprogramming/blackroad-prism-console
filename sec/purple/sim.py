from __future__ import annotations

from pathlib import Path
from typing import List

import yaml

from .. import utils


def run(name: str, cfg_dir: Path, det_dir: Path | None = None) -> dict:
    if det_dir is None:
        det_dir = utils.ARTIFACT_DIR / "detections"
    scenario_path = cfg_dir / f"{name}.yaml"
    scenario = yaml.safe_load(scenario_path.read_text())
    expected: List[str] = scenario.get("expected", [])
    observed: List[str] = []
    for rule in expected:
        if list(det_dir.glob(f"{rule}_*.json")):
            observed.append(rule)
    missing = [r for r in expected if r not in observed]
    result = {
        "name": name,
        "expected": expected,
        "observed": observed,
        "missing": missing,
        "passed": not missing,
    }
    out_dir = utils.ARTIFACT_DIR / "purple" / name
    out_dir.mkdir(parents=True, exist_ok=True)
    utils.write_json(out_dir / "findings.json", result)
    report_lines = [f"scenario: {name}", f"passed: {result['passed']}"]
    if missing:
        report_lines.append("missing: " + ", ".join(missing))
    (out_dir / "report.md").write_text("\n".join(report_lines), encoding="utf-8")
    utils.record_metric("purple_runs")
    return result
