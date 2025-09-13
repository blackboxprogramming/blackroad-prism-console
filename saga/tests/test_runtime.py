from saga.runtime import SagaRuntime, SagaDef, SagaStep


def test_happy_path(tmp_path):
    rt = SagaRuntime(str(tmp_path / "s.json"))

    def a(ctx):
        ctx.setdefault("run", []).append("a")
        return {"a": 1}

    def b(ctx):
        ctx.setdefault("run", []).append("b")
        return {"b": 1}

    sd = SagaDef("S", [SagaStep("a", a, None), SagaStep("b", b, None)])
    rt.register(sd)
    sid = rt.start("S", {})
    st = rt.state[sid]
    while st["status"] != "COMPLETED":
        st = rt.tick(sid)
    assert st["status"] == "COMPLETED"
    assert [t["step"] for t in st["timeline"]] == ["a", "b"]


def test_failure_compensation(tmp_path):
    rt = SagaRuntime(str(tmp_path / "s.json"))

    def step1(ctx):
        ctx["a"] = True
        return {}

    def comp1(ctx):
        ctx["a"] = False
        return {}

    def step2(ctx):
        ctx["b"] = True
        return {}

    def comp2(ctx):
        ctx["b"] = False
        return {}

    def step3(ctx):
        raise RuntimeError("boom")

    sd = SagaDef(
        "S",
        [
            SagaStep("step1", step1, comp1),
            SagaStep("step2", step2, comp2),
            SagaStep("step3", step3, None),
        ],
    )
    rt.register(sd)
    sid = rt.start("S", {})
    st = rt.state[sid]
    while st["status"] not in ("FAILED", "COMPLETED"):
        st = rt.tick(sid)
    assert st["status"] == "FAILED"
    comps = [t.get("compensate") for t in st["timeline"] if "compensate" in t]
    assert comps == ["step2", "step1"]
