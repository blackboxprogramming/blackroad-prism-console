import json
from dataclasses import dataclass
from pathlib import Path
from typing import List

import yaml

from tools import storage

from .model import KG_ARTIFACTS, KnowledgeGraph, _inc_metric
from .query import run as run_query


@dataclass
class Finding:
    rule: str
    node_id: str
    severity: str


def run_rules(rules_yaml: str) -> List[Finding]:
    kg = KnowledgeGraph()
    spec = yaml.safe_load(Path(rules_yaml).read_text())
    findings: List[Finding] = []
    for rule in spec.get("rules", []):
        rows = run_query(rule["match"], kg)
        action = rule.get("action", "")
        for row in rows:
            node_id = next(iter(row.values()))
            severity = "critical" if action == "alert" else "info"
            findings.append(Finding(rule["name"], node_id, severity))
            if action.startswith("flag:"):
                tag = action.split(":", 1)[1]
                node = kg.nodes.get(node_id, {})
                flags = node.setdefault("props", {}).setdefault("flags", [])
                if tag not in flags:
                    flags.append(tag)
                kg.save()
            elif action.startswith("annotate:"):
                payload = action.split(":", 1)[1]
                ann = yaml.safe_load(payload) or {}
                node = kg.nodes.get(node_id, {})
                node.setdefault("props", {}).update(ann)
                kg.save()
            elif action == "alert":
                storage.write(
                    str(KG_ARTIFACTS / "alerts.jsonl"),
                    {"node": node_id, "rule": rule["name"]},
                )
        _inc_metric("kg_rule_run")
    storage.write(
        str(KG_ARTIFACTS / "findings.json"),
        json.dumps([f.__dict__ for f in findings]),
    )
    for _ in findings:
        _inc_metric("kg_rule_finding")
    return findings
