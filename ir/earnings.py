from __future__ import annotations
from pathlib import Path
from datetime import datetime
from .kpi_sot import compute, IR_ARTIFACTS
from .utils import log_metric


def build(period: str, user: str = "U_IR") -> Path:
    if not user.startswith("U_IR"):
        raise PermissionError("IR role required")
    out_dir = IR_ARTIFACTS / f"earnings_{period}"
    out_dir.mkdir(parents=True, exist_ok=True)
    kpis = compute(period)
    script = out_dir / "script.md"
    deck = out_dir / "deck.md"
    exhibits = out_dir / "exhibits"
    exhibits.mkdir(exist_ok=True)
    lines = [f"# Earnings {period}", "## Highlights"]
    for row in kpis[:3]:
        lines.append(f"- {row['id']}: {row['value']} {row['unit']}")
    lines.append("## Financials")
    lines.append("TBD")
    lines.append("## Guidance")
    lines.append("Refer to guidance document")
    lines.append("## Segment view")
    lines.append("Segment data TBD")
    lines.append("## Q&A seed")
    lines.append("- How is revenue trending?")
    script.write_text("\n".join(lines))
    deck.write_text("\n".join(lines))
import json
from datetime import datetime

from .utils import IR_ARTIFACTS, log_metric
from . import kpi_sot


def build(period: str, user: str) -> Path:
    if not user.startswith("U_IR"):
        raise PermissionError("IR role required")
    kpi_path = IR_ARTIFACTS / f"kpi_{period}.json"
    if not kpi_path.exists():
        kpi_sot.compute(period)
    data = json.loads(kpi_path.read_text())
    out_dir = IR_ARTIFACTS / f"earnings_{period}"
    (out_dir / "exhibits").mkdir(parents=True, exist_ok=True)
    revenue = data["revenue"]["value"]
    gm = data["gm_percent"]["value"]
    script = f"# Earnings Script {period}\n\n## Highlights\n- Revenue: {revenue}\n\n## Financials\n- GM%: {gm}\n\n## Guidance\nTBD\n\n## Segment view\nTBD\n\n## Q&A seed\nTBD\n"
    (out_dir / "script.md").write_text(script)
    (out_dir / "deck.md").write_text(script)
    log_metric("ir_earnings_built")
    return out_dir
