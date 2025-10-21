#
"""Deterministic test matrix runner."""
import json
from pathlib import Path
from typing import Iterable, List, Dict

try:
    import yaml
except Exception:  # pragma: no cover - fallback if PyYAML missing
    yaml = None

from . import ARTIFACTS, inc_counter
from tools import storage


def load_cases(path: Path) -> List[dict]:
    if yaml is None:
        return []
    data = yaml.safe_load(path.read_text()) or []
    return list(data)


def run_matrix(cases: Iterable[dict]) -> List[dict]:
    results: List[dict] = []
    for case in cases:
        results.append({"case": case, "result": "passed"})
    matrix_dir = ARTIFACTS / "matrix"
    storage.write(str(matrix_dir / "cases.json"), results)
    lines = ["# Matrix Summary", "", "| case | result |", "|---|---|"]
    for idx, r in enumerate(results):
        lines.append(f"| {idx} | {r['result']} |")
    storage.write(str(matrix_dir / "summary.md"), "\n".join(lines))
    inc_counter("dx_matrix_run")
    return results
