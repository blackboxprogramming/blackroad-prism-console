from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Dict

from tools import storage
from . import incr


def _hash(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for chunk in iter(lambda: fh.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def compare_runs(left_path: str, right_path: str) -> Dict:
    left = Path(left_path)
    right = Path(right_path)
    results = {"added": [], "removed": [], "changed": []}
    left_files = {p.relative_to(left): _hash(p) for p in left.rglob("*") if p.is_file()}
    right_files = {p.relative_to(right): _hash(p) for p in right.rglob("*") if p.is_file()}
    for f in left_files:
        if f not in right_files:
            results["removed"].append(str(f))
        elif left_files[f] != right_files[f]:
            results["changed"].append(str(f))
    for f in right_files:
        if f not in left_files:
            results["added"].append(str(f))
    slug = (left.name + "_vs_" + right.name).replace("/", "_")
    out = Path("artifacts") / f"twin/compare_{slug}"
    out.mkdir(parents=True, exist_ok=True)
    lines = ["# Comparison\n", "|Type|File|\n", "|---|---|\n"]
    for typ in ("added", "removed", "changed"):
        for f in results[typ]:
            lines.append(f"|{typ}|{f}|\n")
    storage.write(str(out / "report.md"), "".join(lines))
    incr("twin_compare_run")
    return results
