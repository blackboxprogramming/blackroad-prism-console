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
