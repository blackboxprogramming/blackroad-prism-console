from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path
from typing import List

import yaml

from tools import storage, metrics
from . import utils


@dataclass
class Item:
    id: str
    impact: float
    cost: float
    time: int
    risk: str
    strategic_fit: float


PERIOD_DIR = lambda period: utils.ARTIFACTS / f"tradeoffs_{period}"


def _load_bets(period: str) -> List[dict]:
    path = utils.ARTIFACTS / f"bets_{period}" / "bets.json"
    return utils.load_json_list(path)


def select(period: str, budget: float) -> List[dict]:
    bets = _load_bets(period)
    items = sorted(bets, key=lambda b: b["est_impact_score"] / b["est_cost_credits"], reverse=True)
    chosen = []
    total = 0.0
    for b in items:
        if total + b["est_cost_credits"] <= budget:
            chosen.append(b)
            total += b["est_cost_credits"]
    out_dir = PERIOD_DIR(period)
    utils.write_json_list(out_dir / "selected.json", chosen)
    metrics.emit("tradeoffs_selected")
    utils.validate_and_write("tradeoffs", {"period": period, "selected": [c["id"] for c in chosen]})
    # policy check
    pol = yaml.safe_load(storage.read("configs/strategy/policies.yaml")) if Path("configs/strategy/policies.yaml").exists() else {}
    mins = pol.get("min_invest", {})
    for theme, amt in mins.items():
        spent = sum(c["est_cost_credits"] for c in chosen if c.get("theme") == theme)
        if spent < amt:
            raise RuntimeError("POLICY_MIN_INVEST_BREACH")
    return chosen


def frontier(period: str) -> List[tuple]:
    bets = _load_bets(period)
    frontier = []
    for b in bets:
        dominated = False
        for f in bets:
            if f is b:
                continue
            if f["est_cost_credits"] <= b["est_cost_credits"] and f["est_impact_score"] >= b["est_impact_score"]:
                dominated = True
                break
        if not dominated:
            frontier.append((b["est_cost_credits"], b["est_impact_score"]))
    out_dir = PERIOD_DIR(period)
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(out_dir / "frontier.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["cost", "impact"])
        for c, i in frontier:
            w.writerow([c, i])
    storage.write(str(out_dir / "summary.md"), "# Trade-off Summary\n")
    return frontier
