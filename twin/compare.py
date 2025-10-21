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
from pathlib import Path
from typing import Dict

from bench.runner import METRICS_PATH
from tools import storage

from .policy_sandbox import get_active_packs

ARTIFACTS = Path("artifacts/twin")


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
    left_files = {p.relative_to(left): p.read_text() for p in left.rglob("*") if p.is_file()}
    right_files = {p.relative_to(right): p.read_text() for p in right.rglob("*") if p.is_file()}
    all_keys = sorted(set(left_files) | set(right_files))
    diffs = []
    for key in all_keys:
        left_val = left_files.get(key)
        right_val = right_files.get(key)
        if left_val != right_val:
            diffs.append({"file": str(key), "left": left_val, "right": right_val})
    slug = f"compare_{left.name}_vs_{right.name}"
    out_dir = ARTIFACTS / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    lines = ["|file|diff|", "|---|---|"]
    for d in diffs:
        lines.append(f"|{d['file']}|changed|")
    report = "\n".join(lines)
    (out_dir / "report.md").write_text(report, encoding="utf-8")
    storage.write(
        str(METRICS_PATH),
        {"event": "twin_compare_run", "slug": slug, "policy_packs": get_active_packs()},
    )
    return {"diffs": diffs}
