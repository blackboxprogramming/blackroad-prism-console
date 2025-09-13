import json
from pathlib import Path

from analytics.cohorts import define_cohort, cohort_view
from analytics.anomaly_rules import run_rules
from analytics.decide import plan_actions
from analytics.narrative import build_report
from alerts.local import trigger, list_alerts

ROOT = Path(__file__).resolve().parents[1]


def test_cohort_analysis():
    define_cohort("apac_flagship", json.loads((ROOT / "samples/cohorts/apac_flagship.json").read_text()))
    define_cohort("emea_flagship", json.loads((ROOT / "samples/cohorts/emea_flagship.json").read_text()))
    res = cohort_view("crm_opps", "apac_flagship", ["revenue", "gross_margin_pct"], "M")
    assert res[0]["revenue"] == 1000
    assert res[1]["gross_margin_pct"] == 41.67
    res2 = cohort_view("crm_opps", "emea_flagship", ["revenue"], "M")
    assert res2[0]["revenue"] == 900


def test_anomaly_and_plan_and_narrative(tmp_path):
    anomalies = run_rules(ROOT / "configs/anomaly_rules.yaml", "W")
    assert any(a["metric"] == "revenue" and a["group"] == "APAC" for a in anomalies)
    assert any(a["metric"] == "uptime" and a["group"] == "db" for a in anomalies)
    anomalies_path = ROOT / "artifacts/anomalies/latest.json"
    plan_path = plan_actions(anomalies_path, ROOT / "configs/goals.yaml", ROOT / "configs/constraints.yaml")
    plan = json.loads(plan_path.read_text())
    assert len(plan["actions"]) == 1
    out = ROOT / "artifacts/reports/exec_test"
    build_report(plan_path, out)
    assert out.with_suffix(".md").exists()
    slides = out.with_name(out.name + "_slides.md")
    assert slides.exists()


def test_alerts():
    anomalies_path = ROOT / "artifacts/anomalies/latest.json"
    trigger("anomalies", anomalies_path, "high")
    alerts = list_alerts(5)
    assert any(a["source"] == "anomalies" for a in alerts)
