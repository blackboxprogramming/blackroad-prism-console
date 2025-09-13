from __future__ import annotations

import json
import yaml
from pathlib import Path
from typing import Dict

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts" / "growth"


def simulate(horizon_weeks: int, config_path: str) -> Dict:
    cfg = yaml.safe_load(Path(config_path).read_text())
    acquire = cfg.get("acquire", 0)
    activate_rate = cfg.get("activate", 0)
    retain_rate = cfg.get("retain", 0)
    refer_rate = cfg.get("refer", 0)
    users = 0
    wau = []
    for _ in range(horizon_weeks):
        new_users = int(acquire * (1 + refer_rate))
        activated = int(new_users * activate_rate)
        users = int(users * retain_rate) + activated
        wau.append(users)
    report = {"WAU": wau, "MAU": wau[-4:]}
    out_dir = ARTIFACTS / f"sim_{horizon_weeks}"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "series.csv").write_text("week,value\n" + "\n".join(f"{i},{v}" for i, v in enumerate(wau)))
    (out_dir / "summary.md").write_text(f"final {users}")
    return report
