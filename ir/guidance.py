from __future__ import annotations
from pathlib import Path
from datetime import datetime
import json
yaml_available = True
try:
    import yaml
except Exception:  # pragma: no cover
    yaml_available = False

from .utils import IR_ARTIFACTS, log_metric


def _prev_period(period: str) -> str:
    year = int(period[:4])
    q = int(period[-1])
    if q == 1:
        year -= 1
        q = 4
    else:
        q -= 1
    return f"{year}Q{q}"


def run(period: str, assumptions_path: str) -> Path:
    if not yaml_available:
        raise RuntimeError("yaml not available")
    with open(assumptions_path) as f:
        a = yaml.safe_load(f)
    prev = _prev_period(period)
    prev_path = IR_ARTIFACTS / f"kpi_{prev}.json"
    if prev_path.exists():
        prev_rev = json.loads(prev_path.read_text())["revenue"]["value"]
    else:
        prev_rev = 1000000
    base = prev_rev * (1 + a.get("seasonality", 0)) * a.get("pipeline_quality", 1) * a.get("supply_constraints", 1) * a.get("fx", 1)
    ranges = {
        "revenue": {
            "base": base,
            "upside": base * 1.1,
            "downside": base * 0.9,
        },
        "gm_percent": {
            "base": a.get("gm_margin", 0.6) * 100,
            "upside": a.get("gm_margin", 0.6) * 100 * 1.05,
            "downside": a.get("gm_margin", 0.6) * 100 * 0.95,
        },
        "op_inc": {
            "base": base * a.get("opinc_margin", 0.15),
            "upside": base * a.get("opinc_margin", 0.15) * 1.1,
            "downside": base * a.get("opinc_margin", 0.15) * 0.9,
        },
    }
    out_dir = IR_ARTIFACTS / f"guidance_{period}"
    out_dir.mkdir(parents=True, exist_ok=True)
    with (out_dir / "ranges.json").open("w") as f:
        json.dump(ranges, f, indent=2)
    narrative = f"Revenue guidance range: {ranges['revenue']['downside']:.0f}-{ranges['revenue']['upside']:.0f}"
    (out_dir / "narrative.md").write_text(narrative)
    log_metric("ir_guidance_run")
    return out_dir
