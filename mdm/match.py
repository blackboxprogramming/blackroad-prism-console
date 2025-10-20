from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Any, Tuple

from tools import artifacts, storage

ROOT = Path(__file__).resolve().parents[0].parents[0]
ARTIFACTS = ROOT / "artifacts" / "mdm"


def load_staged(domain: str) -> List[Dict[str, Any]]:
    content = storage.read(str(ARTIFACTS / "staged" / f"{domain}.json"))
    if not content:
        return []
    data = json.loads(content)
    return data.get("rows", [])


@dataclass
class MatchConfig:
    weights: Dict[str, float]
    auto_merge: float


def load_config(path: Path) -> MatchConfig:
    import yaml

    cfg = yaml.safe_load(path.read_text())
    weights = cfg.get("weights", {})
    thresholds = cfg.get("thresholds", {})
    return MatchConfig(weights=weights, auto_merge=thresholds.get("auto_merge", 1.0))


def score_pair(a: Dict[str, Any], b: Dict[str, Any], weights: Dict[str, float]) -> float:
    score = 0.0
    for field, weight in weights.items():
        if a.get(field) and a.get(field) == b.get(field):
            score += weight
    return score


def cluster(rows: List[Dict[str, Any]], cfg: MatchConfig) -> List[Dict[str, Any]]:
    n = len(rows)
    if n == 0:
        return []

    adjacency: List[List[int]] = [[] for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            if score_pair(rows[i], rows[j], cfg.weights) >= cfg.auto_merge:
                adjacency[i].append(j)
                adjacency[j].append(i)

    seen = [False] * n
    clusters = []
    for i in range(n):
        if seen[i]:
            continue
        stack = [i]
        seen[i] = True
        members: List[int] = []
        while stack:
            idx = stack.pop()
            members.append(idx)
            for neighbor in adjacency[idx]:
                if not seen[neighbor]:
                    seen[neighbor] = True
                    stack.append(neighbor)
        members.sort()
        clusters.append({"members": members})
    return clusters


def match(domain: str, config: Path) -> List[Dict[str, Any]]:
    cfg = load_config(config)
    rows = load_staged(domain)
    clusters = cluster(rows, cfg)
    out_path = ARTIFACTS / "matches" / f"{domain}.json"
    artifacts.validate_and_write(str(out_path), {"domain": domain, "clusters": clusters}, None)
    return clusters

