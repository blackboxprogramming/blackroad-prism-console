from __future__ import annotations

import json
from pathlib import Path
from typing import Dict
from datetime import datetime
import os

import yaml

from tools import storage
from . import incr

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
PROFILES = ROOT / "configs" / "stress"


def load_profile(name: str) -> Dict:
    path = PROFILES / f"{name}.yaml"
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def run_load(profile: Dict, duration_s: int, **kwargs) -> Path:
    arrival = profile.get("arrival_rate", 1)
    count = int(arrival * duration_s)
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    out = ARTIFACTS / f"twin/stress_{profile.get('name', 'run')}_{ts}"
    out.mkdir(parents=True, exist_ok=True)
    summary = {"tasks": count, "duration_s": duration_s}
    storage.write(str(out / "summary.json"), summary)
    timeline_lines = ["ts,count\n"]
    for i in range(duration_s):
        timeline_lines.append(f"{i},{arrival}\n")
    storage.write(str(out / "timelines.csv"), "".join(timeline_lines))
    storage.write(str(out / "errors.jsonl"), "")
    incr("twin_stress_run")
    return out
