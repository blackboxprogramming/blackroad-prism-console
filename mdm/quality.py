from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List
from datetime import datetime

from tools import artifacts, storage

ROOT = Path(__file__).resolve().parents[0].parents[0]
ARTIFACTS = ROOT / "artifacts" / "mdm"


def load_yaml(path: Path) -> Any:
    import yaml

    return yaml.safe_load(path.read_text())


def load_golden(domain: str) -> List[Dict[str, Any]]:
    content = storage.read(str(ARTIFACTS / "golden" / f"{domain}.json"))
    data = json.loads(content) if content else {}
    return data.get("rows", [])


def run_rule(rule: Dict[str, Any], rows: List[Dict[str, Any]]) -> List[str]:
    code = rule["rule"].upper()
    field = rule.get("field")
    violations: List[str] = []
    if code == "REQUIRED":
        for idx, r in enumerate(rows):
            if not r.get(field):
                violations.append(f"row{idx}")
    elif code == "UNIQUE":
        seen = {}
        for idx, r in enumerate(rows):
            val = r.get(field)
            if val in seen:
                violations.append(f"row{idx}")
            else:
                seen[val] = idx
    elif code == "REGEX":
        pattern = re.compile(rule.get("pattern", ""))
        for idx, r in enumerate(rows):
            if r.get(field) and not pattern.match(r[field]):
                violations.append(f"row{idx}")
    elif code == "ENUM":
        allowed = set(rule.get("set", []))
        for idx, r in enumerate(rows):
            if r.get(field) not in allowed:
                violations.append(f"row{idx}")
    elif code == "NOT_NULL_RATIO":
        min_ratio = float(rule.get("min", 1.0))
        not_null = sum(1 for r in rows if r.get(field))
        ratio = not_null / len(rows) if rows else 1.0
        if ratio < min_ratio:
            violations.append("ratio")
    return violations


def dq(domain: str, config: Path) -> Dict[str, Any]:
    rows = load_golden(domain)
    cfg = load_yaml(config)
    results: Dict[str, Any] = {"domain": domain, "checks": []}
    for rule in cfg.get("rules", []):
        violations = run_rule(rule, rows)
        results["checks"].append({"code": rule["rule"], "violations": violations})
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    out_path = ARTIFACTS / "dq" / f"{domain}_{ts}.json"
    artifacts.validate_and_write(str(out_path), results, None)
    summary = "\n".join(f"{c['code']}:{len(c['violations'])}" for c in results["checks"])
    artifacts.validate_and_write(str(ARTIFACTS / "dq_summary.md"), summary, None)
    return results

