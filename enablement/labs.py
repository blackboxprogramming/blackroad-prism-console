from __future__ import annotations

import json
from pathlib import Path

import yaml

from tools import artifacts

from .utils import ART, ROOT, lake_write, record


def _lab_path(lab_id: str) -> Path:
    return ROOT / "configs" / "enablement" / "labs" / f"{lab_id}.yaml"


def run_lab(lab_id: str, submission_file: str) -> dict:
    cfg = yaml.safe_load(_lab_path(lab_id).read_text())
    expected = cfg.get("expected_output")
    sub = json.loads(Path(submission_file).read_text())
    parts = Path(submission_file).stem.split("_")
    user = "_".join(parts[:2]) if len(parts) >= 2 else parts[0]
    output = sub.get("output")
    passed = output == expected
    result = {
        "passed": passed,
        "expected": expected,
        "output": output,
        "override": sub.get("override", False),
    }
    base = ART / "labs" / f"{user}_{lab_id}"
    artifacts.validate_and_write(
        str(base / "result.json"), result, str(ROOT / "contracts" / "schemas" / "lab_results.json")
    )
    report = f"# Lab {lab_id}\n\nResult: {'passed' if passed else 'failed'}"
    artifacts.validate_and_write(str(base / "report.md"), report)
    lake_write(
        "lab_results",
        {
            "user": user,
            "lab": lab_id,
            "passed": passed,
            "expected": expected,
            "output": output,
            "override": sub.get("override", False),
        },
    )
    record("labs_run", 1)
    return result
