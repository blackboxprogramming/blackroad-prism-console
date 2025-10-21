import json
import shutil

from kg.model import KG_ARTIFACTS
from kg.provenance import capture_event
from kg.rules import run_rules


def reset():
    if KG_ARTIFACTS.exists():
        shutil.rmtree(KG_ARTIFACTS)


def test_rules_flag_and_alert():
    reset()
    capture_event({"type": "artifact", "id": "A1", "bot": "Treasury-BOT", "path": "p"})
    capture_event({"type": "decision", "id": "D1", "artifact_id": "A1", "risk": "high"})
    findings = run_rules("configs/kg_rules.yaml")
    names = [f.rule for f in findings]
    assert "orphan_artifacts" in names
    assert "risky_decisions_without_review" in names
    data = json.loads(open(KG_ARTIFACTS / "findings.json").read())
    assert any(f["severity"] == "critical" for f in data)
