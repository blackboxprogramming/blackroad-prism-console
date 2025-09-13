import json
import shutil
from rnd import ideas, experiments


def _clean():
    shutil.rmtree(experiments.ARTIFACTS, ignore_errors=True)
    shutil.rmtree(experiments.LAKE, ignore_errors=True)
    experiments.ARTIFACTS.mkdir(parents=True, exist_ok=True)
    experiments.LAKE.mkdir(parents=True, exist_ok=True)


def test_run_and_decide():
    _clean()
    idea = ideas.new("Adaptive", "p", "s", "u", [])
    exp = experiments.design(idea.id, "h", "m")
    plan = experiments.ARTIFACTS / "experiments" / exp.id / "plan.md"
    assert plan.exists()
    experiments.run(exp.id)
    res = experiments.ARTIFACTS / "experiments" / exp.id / "results.json"
    assert res.exists()
    experiments.decide(exp.id, "invest", "reason")
    dec = experiments.ARTIFACTS / "experiments" / exp.id / "decision.md"
    assert dec.exists()
