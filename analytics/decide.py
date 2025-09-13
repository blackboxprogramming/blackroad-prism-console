import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List

import yaml

from .utils import increment, log_event, validate

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "artifacts" / "decisions"

HEURISTICS = {
    "uptime": {
        "action": "Roll out SRE mitigation",
        "bot": "sre_bot",
        "owner": "bob",
        "credits": 8,
        "impact": 4,
    },
    "revenue": {
        "action": "Adjust Pricing",
        "bot": "pricing_bot",
        "owner": "alice",
        "credits": 10,
        "impact": 5,
    },
}


def choose_actions(goals: List[str], constraints: Dict[str, int], candidates: List[Dict]) -> Dict:
    budget = constraints["credit_budget"]
    k = constraints["max_concurrent"]
    chosen: List[Dict] = []
    spent = 0
    for cand in sorted(candidates, key=lambda c: (-c["impact"], c["action"])):
        if spent + cand["credits"] <= budget and len(chosen) < k:
            chosen.append(cand)
            spent += cand["credits"]
    raci = {c["bot"]: c["owner"] for c in chosen}
    return {"actions": chosen, "raci": raci}


def plan_actions(anomalies_path: Path, goals_path: Path, constraints_path: Path) -> Path:
    anomalies = json.loads(anomalies_path.read_text())
    goals = yaml.safe_load(goals_path.read_text()).get("goals", [])
    constraints = yaml.safe_load(constraints_path.read_text())
    candidates: List[Dict] = []
    for anom in anomalies:
        h = HEURISTICS.get(anom["metric"])
        if h:
            candidates.append(h.copy())
    plan = choose_actions(goals, constraints, candidates)
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    ART.mkdir(parents=True, exist_ok=True)
    out_path = ART / f"plan_{ts}.json"
    out_path.write_text(json.dumps(plan, indent=2))
    validate(plan, "plan.schema.json")
    increment("decision_plan")
    log_event({"type": "decision_plan", "anomalies": str(anomalies_path)})
    return out_path
