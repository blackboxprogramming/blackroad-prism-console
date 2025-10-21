from __future__ import annotations
import json
from pathlib import Path
from datetime import datetime
import yaml
from .kpi_sot import _base, IR_ARTIFACTS
from .utils import log_metric


def run(period: str, assumptions_path: Path) -> Path:
    assumptions = yaml.safe_load(Path(assumptions_path).read_text())
    prior = 1000 + _base("prev" + period)
    seasonality = assumptions.get("seasonality", 1.0)
    pipeline = assumptions.get("pipeline_quality", 1.0)
    supply = assumptions.get("supply_constraints", 1.0)
    fx = assumptions.get("fx", 0)
    revenue_base = prior * seasonality * pipeline * supply + fx
    gm_base = 50 * seasonality
    opinc_base = revenue_base * 0.1

    def ranges(base: float) -> dict:
        return {
            "downside": [round(base * 0.9, 2), round(base * 0.95, 2)],
            "base": [round(base * 0.98, 2), round(base * 1.02, 2)],
            "upside": [round(base * 1.05, 2), round(base * 1.1, 2)],
        }

    data = {
        "revenue": ranges(revenue_base),
        "gm_pct": ranges(gm_base),
        "opinc": ranges(opinc_base),
        "assumptions": assumptions,
    }
    out_dir = IR_ARTIFACTS / f"guidance_{period}"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "ranges.json").write_text(json.dumps(data, indent=2))
    (out_dir / "narrative.md").write_text("# Guidance\nDeterministic narrative")
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
