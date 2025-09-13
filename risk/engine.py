import datetime
import json
from pathlib import Path
from typing import Any, Dict, List

import mpmath
import yaml

REGISTER_FILE = Path(__file__).with_name("register.yaml")


def load_register(path: Path = REGISTER_FILE) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def risk_score(likelihood: float, impact: float) -> float:
    return likelihood * impact


def scenario_scores(likelihood: float, impact: float) -> Dict[str, float]:
    return {
        "best": risk_score(likelihood * 0.5, impact * 0.5),
        "expected": risk_score(likelihood, impact),
        "worst": min(1.0, risk_score(likelihood * 1.5, impact * 1.5)),
    }


def lucidia_trigger(score: float) -> str:
    if score > 0.7:
        return "spiral"
    if score < 0.3:
        return "anchor"
    return "none"


def tail_risk(scores: List[float]) -> float:
    s = sum(scores)
    return float(mpmath.zeta(1 + s))


def build_dashboard(register: List[Dict[str, Any]]) -> Dict[str, Any]:
    entries = []
    for item in register:
        scenarios = scenario_scores(item["likelihood"], item["impact"])
        base = scenarios["expected"]
        entries.append(
            {
                "id": item["id"],
                "description": item["description"],
                "mitigation": item["mitigation"],
                "score": base,
                "scenarios": scenarios,
                "lucidia_trigger": lucidia_trigger(base),
            }
        )
    tail = tail_risk([e["score"] for e in entries])
    return {"generated": datetime.datetime.utcnow().isoformat(), "entries": entries, "tail_risk": tail}


def export_dashboard(dashboard: Dict[str, Any]) -> None:
    out_json = Path(__file__).with_name("dashboard.json")
    out_html = Path(__file__).with_name("dashboard.html")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(dashboard, f, indent=2)
    rows = []
    for e in dashboard["entries"]:
        rows.append(
            f"<tr><td>{e['id']}</td><td>{e['description']}</td><td>{e['score']:.2f}</td><td>{e['lucidia_trigger']}</td></tr>"
        )
    html = (
        "<html><body><h1>Risk Dashboard</h1><table><tr><th>ID</th><th>Description</th><th>Score" 
        "</th><th>Trigger</th></tr>" + "".join(rows) + "</table></body></html>"
    )
    with open(out_html, "w", encoding="utf-8") as f:
        f.write(html)


def main() -> None:
    register = load_register()
    dashboard = build_dashboard(register)
    export_dashboard(dashboard)


if __name__ == "__main__":
    main()
    print("Risk dashboard generated")
