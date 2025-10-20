from __future__ import annotations

from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List

from tools import metrics
from . import utils


@dataclass
class Objective:
    id: str
    level: str
    owner: str
    period: str
    text: str
    links: List[str]


@dataclass
class KeyResult:
    id: str
    objective_id: str
    metric: str
    target: float
    current: float
    unit: str
    confidence: float
    scoring: str


def _period_dir(period: str) -> Path:
    return utils.ARTIFACTS / f"okr_{period}"


def _load(period: str):
    base = _period_dir(period)
    objs = utils.load_json_list(base / "objectives.json")
    krs = utils.load_json_list(base / "key_results.json")
    return objs, krs


def _find_period_for_obj(obj_id: str) -> str:
    for path in utils.ARTIFACTS.glob("okr_*"):
        objs = utils.load_json_list(path / "objectives.json")
        if any(o["id"] == obj_id for o in objs):
            return path.name.split("_")[1]
    raise ValueError("objective not found")


def new_objective(level: str, owner: str, period: str, text: str) -> Objective:
    objs, _ = _load(period)
    obj_id = utils.next_id("O", objs)
    obj = Objective(id=obj_id, level=level, owner=owner, period=period, text=text, links=[])
    objs.append(asdict(obj))
    utils.write_json_list(_period_dir(period) / "objectives.json", objs)
    metrics.emit("okr_objs_created")
    utils.validate_and_write("okrs", asdict(obj))
    return obj


def new_key_result(objective_id: str, metric: str, target: float, unit: str, scoring: str) -> KeyResult:
    period = _find_period_for_obj(objective_id)
    _, krs = _load(period)
    kr_id = utils.next_id("K", krs)
    kr = KeyResult(
        id=kr_id,
        objective_id=objective_id,
        metric=metric,
        target=target,
        current=0,
        unit=unit,
        confidence=1.0,
        scoring=scoring,
    )
    krs.append(asdict(kr))
    utils.write_json_list(_period_dir(period) / "key_results.json", krs)
    metrics.emit("okr_krs_created")
    utils.validate_and_write("okrs", asdict(kr))
    return kr


def link(child_id: str, parent_id: str) -> None:
    period = _find_period_for_obj(child_id)
    try:
        _find_period_for_obj(parent_id)
    except ValueError as exc:
        raise ValueError(f"parent objective {parent_id} not found") from exc
    objs, _ = _load(period)
    for obj in objs:
        if obj["id"] == child_id:
            if parent_id not in obj["links"]:
                obj["links"].append(parent_id)
    utils.write_json_list(_period_dir(period) / "objectives.json", objs)
    metrics.emit("okr_links_valid")
    utils.validate_and_write("okr_links", {"child": child_id, "parent": parent_id, "period": period})


def validate(period: str) -> bool:
    objs, _ = _load(period)
    ok = True
    for obj in objs:
        if obj["level"] != "company" and not obj["links"]:
            ok = False
    if ok:
        metrics.emit("okr_links_valid")
    return ok
