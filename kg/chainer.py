import json
from dataclasses import dataclass
from pathlib import Path
from typing import List

from tools import storage

from .model import KG_ARTIFACTS, KnowledgeGraph, _inc_metric
from .provenance import _next_artifact_id, capture_event
from .query import run as run_query

CHAIN_MAX_FANOUT = 5


@dataclass
class PlanStep:
    bot: str
    intent: str
    input_selector: str


def execute_plan(plan: List[PlanStep]) -> List[str]:
    kg = KnowledgeGraph()
    prev: List[str] = []
    final: List[str] = []
    for step in plan:
        kg = KnowledgeGraph()
        if step.bot == "Change/Release-BOT":
            findings_path = KG_ARTIFACTS / "findings.json"
            if Path(findings_path).exists():
                findings = json.loads(storage.read(str(findings_path)) or "[]")
                if any(f.get("severity") == "critical" for f in findings):
                    raise RuntimeError("KG_POLICY_BLOCK")
        rows = run_query(step.input_selector, kg)
        rows = sorted(rows, key=lambda r: list(r.values())[0])[:CHAIN_MAX_FANOUT]
        new_ids: List[str] = []
        for row in rows:
            inp = list(row.values())[0]
            art_id = _next_artifact_id()
            capture_event(
                {
                    "type": "artifact",
                    "id": art_id,
                    "bot": step.bot,
                    "intent": step.intent,
                    "input": inp,
                }
            )
            if prev:
                kg = KnowledgeGraph()
                for p in prev:
                    kg.add_edge(art_id, "DERIVED_FROM", p)
            new_ids.append(art_id)
        prev = new_ids
        final = new_ids
        _inc_metric("kg_chain_run")
    return final
