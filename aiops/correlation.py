"""Rule based correlation engine.

The correlate function evaluates rule definitions against event sources and
produces correlation artifacts.
"""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional

import yaml

from . import ARTIFACTS, ROOT, _inc

CONFIG = ROOT / "configs" / "aiops" / "correlation.yaml"


def _load_rules() -> List[dict]:
    with open(CONFIG, "r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    return data.get("rules", [])


def _match(event: dict, cond: dict, now: datetime) -> bool:
    for k, v in cond.get("match", {}).items():
        if event.get(k) != v:
            return False
    if "within_minutes" in cond:
        ts = datetime.fromisoformat(event.get("timestamp"))
        delta = abs((now - ts).total_seconds()) / 60
        if delta > cond["within_minutes"]:
            return False
    return True


def correlate(
    now: Optional[datetime] = None,
    sources: Optional[Dict[str, Iterable[dict]]] = None,
    artifacts_dir: Path = ARTIFACTS,
) -> List[dict]:
    """Run correlation rules and write artifacts.

    Parameters
    ----------
    now: datetime
        Reference time for time based rule evaluation.
    sources: dict
        Mapping of source name to iterable of events.
    artifacts_dir: Path
        Location where correlation artifacts will be written.
    """
    now = now or datetime.utcnow()
    if sources is None:
        sources = {}
        for name in ["incidents", "healthchecks", "changes", "anomalies", "synthetic"]:
            path = artifacts_dir / f"{name}.json"
            if path.exists():
                with open(path, "r", encoding="utf-8") as fh:
                    sources[name] = json.load(fh)
            else:
                sources[name] = []

    rules = _load_rules()
    corrs: List[dict] = []
    for rule in rules:
        matched: Dict[str, dict] = {}
        for cond in rule.get("when", []):
            src = cond["source"]
            events = sources.get(src, [])
            found = None
            for ev in events:
                if _match(ev, cond, now):
                    found = ev
                    break
            if not found:
                matched = {}
                break
            matched[src] = found
        if matched:
            item = {"rule": rule.get("name"), **rule.get("emit", {}), "matched": matched}
            corrs.append(item)

    out_dir = artifacts_dir / "aiops"
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = now.strftime("%Y%m%d%H%M%S")
    json_path = out_dir / f"correlations_{ts}.json"
    with open(json_path, "w", encoding="utf-8") as fh:
        json.dump(corrs, fh, indent=2)
    with open(out_dir / "summary.md", "w", encoding="utf-8") as fh:
        for c in corrs:
            fh.write(f"- {c['rule']} => {c.get('kind')}\n")

    _inc("aiops_correlations", len(corrs))
    return corrs
