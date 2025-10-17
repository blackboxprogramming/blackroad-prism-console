from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import List

from tools import storage, metrics, artifacts
from . import ROOT, ARTIFACTS, LAKE, FIXTURES

COUNTER = ARTIFACTS / "last_experiment_id.txt"
LAKE_TABLE = LAKE / "rnd_experiments.json"
SCHEMA = "contracts/schemas/rnd_experiments.json"
WIP_LIMIT = 2


@dataclass
class Experiment:
    id: str
    idea_id: str
    hypothesis: str
    method: str
    metrics: List[str]
    fixtures: str
    status: str = "design"
    decision: str | None = None


def _next_id() -> str:
    last = int(storage.read(str(COUNTER)) or 0)
    new = last + 1
    storage.write(str(COUNTER), str(new))
    return f"E{new:03d}"


def _write_meta(exp: Experiment) -> None:
    path = ARTIFACTS / "experiments" / exp.id / "experiment.json"
    storage.write(str(path), asdict(exp))


def design(idea_id: str, hypothesis: str, method: str) -> Experiment:
    exp_id = _next_id()
    exp = Experiment(
        id=exp_id,
        idea_id=idea_id,
        hypothesis=hypothesis,
        method=method,
        metrics=[],
        fixtures=str(FIXTURES / exp_id),
    )
    plan_path = ARTIFACTS / "experiments" / exp_id / "plan.md"
    content = f"# Experiment {exp_id}\n\n## Hypothesis\n{hypothesis}\n\n## Method\n{method}\n"
    storage.write(str(plan_path), content)
    _write_meta(exp)
    _append_lake(exp)
    return exp


def _append_lake(exp: Experiment) -> None:
    existing = json.loads(storage.read(str(LAKE_TABLE)) or "[]")
    existing = [e for e in existing if e.get("id") != exp.id]
    existing.append(asdict(exp))
    artifacts.validate_and_write(str(LAKE_TABLE), existing, SCHEMA)


def _count_running() -> int:
    existing = json.loads(storage.read(str(LAKE_TABLE)) or "[]")
    return sum(1 for e in existing if e.get("status") == "running")


def run(exp_id: str) -> Path:
    if _count_running() >= WIP_LIMIT:
        raise RuntimeError("RND_WIP_LIMIT")
    meta_path = ARTIFACTS / "experiments" / exp_id / "experiment.json"
    data = json.loads(storage.read(str(meta_path)))
    exp = Experiment(**data)
    exp.status = "running"
    _write_meta(exp)
    fixture_file = Path(exp.fixtures)
    results = {}
    if fixture_file.is_dir():
        for f in fixture_file.glob("*.json"):
            results.update(json.loads(storage.read(str(f))))
    elif fixture_file.with_suffix(".json").exists():
        results.update(json.loads(storage.read(str(fixture_file.with_suffix(".json")))))
    res_path = ARTIFACTS / "experiments" / exp_id / "results.json"
    storage.write(str(res_path), results)
    exp.status = "analyzed"
    _write_meta(exp)
    _append_lake(exp)
    metrics.emit("rnd_exp_run")
    return res_path


def decide(exp_id: str, decision: str, reason: str) -> None:
    meta_path = ARTIFACTS / "experiments" / exp_id / "experiment.json"
    data = json.loads(storage.read(str(meta_path)))
    exp = Experiment(**data)
    exp.status = "decision"
    exp.decision = decision
    dec_path = ARTIFACTS / "experiments" / exp_id / "decision.md"
    storage.write(str(dec_path), f"{decision}\n\n{reason}\n")
    _write_meta(exp)
    _append_lake(exp)
