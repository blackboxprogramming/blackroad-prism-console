from __future__ import annotations

from pathlib import Path
from typing import Dict, List

import yaml

from .flag_analytics import impact

ROOT = Path(__file__).resolve().parents[1]
GUARDRAILS = ROOT / "configs" / "experiments" / "guardrails.yaml"


def plan(feature: str, stages: List[int]) -> Dict:
    return {"feature": feature, "stages": stages}


def gate(feature: str, stage: int) -> str:
    imp = impact(feature, 14)
    cfg = yaml.safe_load(GUARDRAILS.read_text())
    thr = cfg.get("purchase_value", {}).get("max_degradation_pct", 1)
    baseline = imp["without"]
    if baseline and (imp["diff"] < -baseline * thr):
        return "BLOCK(GUARDRAIL_PURCHASE_VALUE)"
    return "OK"
