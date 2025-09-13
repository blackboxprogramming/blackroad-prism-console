from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Any, List

from tools import artifacts, storage

ROOT = Path(__file__).resolve().parents[0].parents[0]
ARTIFACTS = ROOT / "artifacts" / "mdm"


def load_yaml(path: Path) -> Dict[str, Any]:
    import yaml

    return yaml.safe_load(path.read_text())


def load_staged(domain: str) -> List[Dict[str, Any]]:
    content = storage.read(str(ARTIFACTS / "staged" / f"{domain}.json"))
    data = json.loads(content) if content else {}
    return data.get("rows", [])


def load_clusters(domain: str) -> List[Dict[str, Any]]:
    content = storage.read(str(ARTIFACTS / "matches" / f"{domain}.json"))
    data = json.loads(content) if content else {}
    return data.get("clusters", [])


def select_row(rows: List[Dict[str, Any]], members: List[int], precedence: List[str]) -> Dict[str, Any]:
    candidates = [rows[i] for i in members]
    for src in precedence:
        for r in candidates:
            if r.get("source") == src.casefold():
                return r
    # fallback to most recent updated_at
    return max(candidates, key=lambda r: r.get("updated_at", ""))


def merge(domain: str, policy: Path) -> List[Dict[str, Any]]:
    pol = load_yaml(policy)
    precedence = pol.get("precedence", [])
    rows = load_staged(domain)
    clusters = load_clusters(domain)
    golden: List[Dict[str, Any]] = []
    used = set()
    for cluster in clusters:
        members = cluster.get("members", [])
        row = select_row(rows, members, precedence)
        golden.append(row)
        used.update(members)
    for i, r in enumerate(rows):
        if i not in used:
            golden.append(r)
    out_path = ARTIFACTS / "golden" / f"{domain}.json"
    prev_content = storage.read(str(out_path))
    artifacts.validate_and_write(str(out_path), {"domain": domain, "rows": golden}, None)
    diff_path = ARTIFACTS / "golden" / f"{domain}_diff.md"
    prev_rows = len(json.loads(prev_content).get("rows", [])) if prev_content else 0
    diff_summary = f"prev={prev_rows} curr={len(golden)}"
    artifacts.validate_and_write(str(diff_path), diff_summary, None)
    return golden

