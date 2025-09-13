import json
from experiments import registry, ab_engine, review_pack


def test_review_pack(tmp_path):
    exp = registry.Experiment(
        id="EXP01",
        name="Paywall copy",
        feature="paywall_v2",
        start="",
        end="",
        unit="user",
        variants=["A", "B"],
        split=[0.5, 0.5],
    )
    registry.register_experiment(exp)
    ab_engine.analyze(exp, "configs/experiments/metrics.yaml")
    res = review_pack.build("EXP01")
    log = (registry.ARTIFACTS / "decisions.jsonl").read_text().strip().splitlines()[-1]
    entry = json.loads(log)
    assert entry["id"] == "EXP01"
    assert "decision" in res
