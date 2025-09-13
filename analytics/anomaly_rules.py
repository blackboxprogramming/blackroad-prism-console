import ast
import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List

import yaml

from .utils import increment, log_event, validate

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "samples" / "metrics"
ART = ROOT / "artifacts" / "anomalies"


class SafeEval(ast.NodeVisitor):
    allowed = (
        ast.Expression,
        ast.Compare,
        ast.Name,
        ast.Load,
        ast.BinOp,
        ast.UnaryOp,
        ast.Num,
        ast.operator,
        ast.unaryop,
        ast.cmpop,
    )

    def visit(self, node):  # type: ignore[override]
        if not isinstance(node, self.allowed):
            raise ValueError("unsafe expression")
        return super().visit(node)


def _eval(expr: str, ctx: Dict[str, float]) -> bool:
    tree = ast.parse(expr, mode="eval")
    SafeEval().visit(tree)
    return bool(eval(compile(tree, "<expr>", "eval"), {"__builtins__": {}}, ctx))


def _load_series(metric: str, group_by: str) -> Dict[str, List[Dict[str, float]]]:
    data = json.loads(Path(DATA_DIR / f"{metric}_{group_by}.json").read_text())
    buckets: Dict[str, List[Dict[str, float]]] = defaultdict(list)
    for row in data:
        buckets[row[group_by]].append(row)
    for rows in buckets.values():
        rows.sort(key=lambda r: r["date"])
    return buckets


def detect_anomalies(metric: str, group_by: str, window: str, rule: Dict[str, str]) -> List[Dict]:
    series = _load_series(metric, group_by)
    anomalies: List[Dict] = []
    for grp, rows in series.items():
        if len(rows) < 5:
            continue
        trailing = rows[-5:-1]
        mean = sum(r["value"] for r in trailing) / len(trailing)
        current = rows[-1]["value"]
        prev = rows[-2]["value"]
        pct_drop = (mean - current) / mean * 100 if mean else 0
        delta = current - prev
        ctx = {"value": current, "pct_drop": pct_drop, "delta": delta}
        if _eval(rule["condition"], ctx):
            anomalies.append(
                {
                    "metric": metric,
                    "group": grp,
                    "severity": rule["severity"],
                    "value": current,
                    "pct_drop": round(pct_drop, 2),
                }
            )
    return anomalies


def run_rules(rules_path: Path, window: str) -> List[Dict]:
    rules = yaml.safe_load(rules_path.read_text())["rules"]
    all_anoms: List[Dict] = []
    for rule in rules:
        all_anoms.extend(
            detect_anomalies(rule["metric"], rule["group_by"], window, rule)
        )
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    ART.mkdir(parents=True, exist_ok=True)
    out_path = ART / f"{ts}.json"
    storage_path = ART / "latest.json"
    out_path.write_text(json.dumps(all_anoms, indent=2))
    storage_path.write_text(json.dumps(all_anoms, indent=2))
    summary = ART / f"{ts}.md"
    summary.write_text("\n".join(f"- {a['metric']} {a['group']}" for a in all_anoms))
    validate(all_anoms, "anomaly.schema.json")
    increment("anomaly_detect")
    log_event({"type": "anomaly_detect", "rules": str(rules_path), "lineage": [r.get("metric") for r in rules]})
    return all_anoms
