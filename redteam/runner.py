from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List

import metrics
import settings
from orchestrator.protocols import BotResponse
from safety import policy
from tools import storage

from .scenarios import load_scenario


@dataclass
class Report:
    name: str
    passed: bool
    violations: List[str]


def run_scenario(name: str) -> Report:
    cfg = load_scenario(name)
    steps = cfg.get("steps", [])
    all_violations: List[str] = []

    for step in steps:
        hazards = step.get("expect", {}).get("hazards", [])
        resp = BotResponse(
            task_id="redteam",
            summary="REDACTED",
            steps=["simulated"],
            data={},
            risks=hazards,
            artifacts=[],
            next_actions=[],
            ok=True,
        )
        violations = policy.evaluate(resp, settings.PACKS_ENABLED)
        all_violations.extend(violations)
        for token in step.get("expect", {}).get("must_contain", []):
            if token not in resp.summary:
                all_violations.append(f"MISSING_{token}")

    passed = not all_violations
    report = Report(name=name, passed=passed, violations=all_violations)

    out_dir = Path("artifacts") / "redteam" / name
    storage.write(str(out_dir / "log.jsonl"), {"steps": steps})
    storage.write(
        str(out_dir / "report.md"),
        f"# {name}\npassed: {passed}\nviolations: {all_violations}",
    )

    metrics.inc("redteam_runs")
    metrics.record("redteam_run", {"name": name, "passed": passed})
    return report
