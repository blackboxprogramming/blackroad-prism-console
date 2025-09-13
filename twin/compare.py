from pathlib import Path
from typing import Dict

from bench.runner import METRICS_PATH
from tools import storage

from .policy_sandbox import get_active_packs

ARTIFACTS = Path("artifacts/twin")


def compare_runs(left_path: str, right_path: str) -> Dict:
    left = Path(left_path)
    right = Path(right_path)
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
