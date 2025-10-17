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
    log_metric("ir_guidance_run")
    return out_dir
