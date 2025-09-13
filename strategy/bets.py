from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List

import yaml

from tools import metrics, storage
from . import utils


@dataclass
class Bet:
    id: str
    title: str
    owner: str
    period: str
    theme: str
    est_cost_credits: float
    est_impact_score: float
    risk: str
    time_to_value_weeks: int
    score: float | None = None


def _period_dir(period: str) -> Path:
    return utils.ARTIFACTS / f"bets_{period}"


def _load(period: str) -> List[dict]:
    return utils.load_json_list(_period_dir(period) / "bets.json")


def new_bet(title: str, owner: str, period: str, est_cost: float, est_impact: float, risk: str, ttv: int, theme: str = "") -> Bet:
    bets = _load(period)
    bet_id = utils.next_id("B", bets)
    bet = Bet(
        id=bet_id,
        title=title,
        owner=owner,
        period=period,
        theme=theme,
        est_cost_credits=est_cost,
        est_impact_score=est_impact,
        risk=risk,
        time_to_value_weeks=ttv,
    )
    bets.append(asdict(bet))
    utils.write_json_list(_period_dir(period) / "bets.json", bets)
    metrics.emit("bets_created")
    utils.validate_and_write("bets", asdict(bet))
    return bet


def _score(bet: Bet, cfg: dict, max_ttv: int = 52) -> float:
    w = cfg.get("weights", {})
    risk_pen = w.get("risk", {}).get(bet.risk, 0)
    speed_bonus = (max_ttv - bet.time_to_value_weeks) * w.get("speed", 0)
    score = bet.est_impact_score * w.get("impact", 1) - bet.est_cost_credits * w.get("cost", 1) - risk_pen + speed_bonus
    return score


def rank(period: str, cfg_path: Path) -> List[Bet]:
    # duty of care: require KR baseline file
    baseline = Path("fixtures/strategy/okrs_{period}.json".format(period=period))
    if not baseline.exists():
        raise RuntimeError("DUTY_KR_BASELINE_MISSING")
    bets = [Bet(**b) for b in _load(period)]
    cfg = yaml.safe_load(storage.read(str(cfg_path))) if cfg_path.exists() else {}
    for bet in bets:
        bet.score = _score(bet, cfg)
    bets.sort(key=lambda b: (-b.score, b.id))
    lines = [f"{b.id}\t{b.title}\t{b.score:.2f}" for b in bets]
    utils.write_json_list(_period_dir(period) / "bets.json", [asdict(b) for b in bets])
    utils._ensure_dir(_period_dir(period) / "ranked.md")
    storage.write(str(_period_dir(period) / "ranked.md"), "\n".join(lines))
    metrics.emit("bets_ranked")
    for b in bets:
        utils.validate_and_write("bets", asdict(b))
    return bets
