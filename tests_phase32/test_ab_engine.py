from experiments import registry, ab_engine


def setup_exp():
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
    return exp


def test_ab_metrics(tmp_path):
    exp = setup_exp()
    res = ab_engine.analyze(exp, "configs/experiments/metrics.yaml")
    assert "activation_rate" in res["metrics"]
    assert res["decision"] in {"ship", "hold"}
