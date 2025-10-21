import csv
import json
from pathlib import Path
from typing import Dict


def build(demo_csv: Path, attrition_csv: Path, recruiting_data: Path, pay_bands_yaml: Path, out_dir: Path) -> Dict[str, float]:
    people = list(csv.DictReader(demo_csv.open()))
    attrition = list(csv.DictReader(attrition_csv.open()))
    recruits = json.loads(recruiting_data.read_text()) if recruiting_data.exists() else []
    # metrics
    metrics: Dict[str, float] = {}
    metrics["headcount"] = len(people)
    metrics["attrition_rate"] = len(attrition) / len(people) if people else 0.0
    offers = [r for r in recruits if r.get("stage") == "offer"]
    accepts = [r for r in recruits if r.get("stage") == "accept"]
    metrics["offer_accept_rate"] = len(accepts) / len(offers) if offers else 0.0
    out_dir.mkdir(parents=True, exist_ok=True)
    rows = ["metric,value"] + [f"{k},{v}" for k, v in metrics.items()]
    (out_dir / "tables.csv").write_text("\n".join(rows))
    dashboard_md = "\n".join([f"- {k}: {v}" for k, v in metrics.items()])
    (out_dir / "dashboard.md").write_text(dashboard_md)
    (out_dir / "dashboard.html").write_text(f"<ul>{''.join([f'<li>{k}:{v}</li>' for k,v in metrics.items()])}</ul>")
    return metrics
