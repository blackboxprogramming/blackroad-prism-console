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
import json
from pathlib import Path
from typing import Dict

import yaml  # type: ignore[import-untyped]

from bench.runner import METRICS_PATH
from tools import storage

from .policy_sandbox import get_active_packs

CONFIG_DIR = Path("configs/stress")
ARTIFACTS = Path("artifacts/twin")


def load_profile(name: str) -> Dict:
    path = CONFIG_DIR / f"{name}.yaml"
    data = yaml.safe_load(path.read_text())
    data["name"] = name
    return data


def run_load(
    profile: Dict, duration_s: int, cache: str = "on", exec: str = "inproc", tenant: str = "system"
) -> Dict:
    total = int(profile.get("arrival_rate", 1) * duration_s)
    out_dir = ARTIFACTS / f"stress_{profile['name']}"
    out_dir.mkdir(parents=True, exist_ok=True)
    summary = {
        "submitted": total,
        "failures": 0,
        "quota_blocks": 0,
        "policy_packs": get_active_packs(),
        "cache": cache,
        "exec": exec,
        "tenant": tenant,
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    (out_dir / "timelines.csv").write_text(
        "t,submitted\n0,{total}\n".replace("{total}", str(total)), encoding="utf-8"
    )
    (out_dir / "errors.jsonl").write_text("", encoding="utf-8")
    storage.write(str(METRICS_PATH), {"event": "twin_stress_run", "profile": profile["name"]})
    return summary
