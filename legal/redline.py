from __future__ import annotations

import json
import difflib
from pathlib import Path
from typing import Dict, List

RISK_MAP = {"low": 10, "med": 50, "high": 100}


def compare(old_path: str, new_path: str) -> Dict[str, List]:
    old_lines = Path(old_path).read_text().splitlines()
    new_lines = Path(new_path).read_text().splitlines()
    sm = difflib.SequenceMatcher(a=old_lines, b=new_lines)
    added: List[str] = []
    removed: List[str] = []
    changed: List[Dict[str, str]] = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "insert":
            added.extend(new_lines[j1:j2])
        elif tag == "delete":
            removed.extend(old_lines[i1:i2])
        elif tag == "replace":
            changed.extend(
                [{"from": o, "to": n} for o, n in zip(old_lines[i1:i2], new_lines[j1:j2])]
            )
    return {"added": added, "removed": removed, "changed": changed}


def risk_score(diff: Dict[str, List], clause_meta: Dict[str, Dict[str, str]]) -> int:
    score = 0
    for change in diff["changed"]:
        text = change["to"]
        for cid, meta in clause_meta.items():
            if cid in text:
                score += RISK_MAP.get(meta.get("risk", "low"), 0)
    for line in diff["added"] + diff["removed"]:
        for cid, meta in clause_meta.items():
            if cid in line:
                score += RISK_MAP.get(meta.get("risk", "low"), 0)
    return min(score, 100)


def write_redline(old_path: str, new_path: str, out_prefix: str) -> Dict[str, List]:
    diff = compare(old_path, new_path)
    out = Path(out_prefix)
    out.parent.mkdir(parents=True, exist_ok=True)
    (out.with_suffix(".json")).write_text(json.dumps(diff, indent=2))
    old_lines = Path(old_path).read_text().splitlines()
    new_lines = Path(new_path).read_text().splitlines()
    md = "\n".join(
        difflib.unified_diff(old_lines, new_lines, fromfile=old_path, tofile=new_path)
    )
    (out.with_suffix(".md")).write_text(md)
    return diff
