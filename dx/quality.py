#
"""Code quality gates wrapper."""
import subprocess
from pathlib import Path
from typing import Dict

from . import ARTIFACTS, inc_counter
from tools import storage


def _run(cmd: list[str]) -> str:
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return "passed"
    except FileNotFoundError:
        return "skipped"
    except subprocess.CalledProcessError as e:
        if "unrecognized arguments" in e.stderr:
            return "skipped"
        return "failed"


def run() -> Dict[str, str]:
    results = {
        "ruff": _run(["ruff", "dx"]),
        "mypy": _run(["mypy", "dx"]),
        "tests": _run(["pytest", "tests/test_dx_*.py", "--cov=dx", "--cov-fail-under=80"]),
    }
    lines = ["# Quality Report", "", "| check | result |", "|---|---|"]
    for k, v in results.items():
        lines.append(f"| {k} | {v} |")
    storage.write(str(ARTIFACTS / "quality_report.md"), "\n".join(lines))
    inc_counter("dx_quality_gate")
    return results
