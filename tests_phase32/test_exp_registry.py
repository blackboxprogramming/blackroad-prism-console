from experiments import registry


def test_deterministic_assignment(tmp_path):
    exp = registry.Experiment(
        id="EXP01",
        name="t",
        feature="f",
        start="",
        end="",
        unit="user",
        variants=["A", "B"],
        split=[0.5, 0.5],
    )
    registry.register_experiment(exp)
    reg = registry.load_registry()
    exp_loaded = reg["EXP01"]
    v1 = registry.assign_variant(exp_loaded, "12345")
    v2 = registry.assign_variant(exp_loaded, "12345")
    assert v1 == v2
    assert v1 in ["A", "B"]
