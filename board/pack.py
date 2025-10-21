from __future__ import annotations
from pathlib import Path
from ir.kpi_sot import compute
from ir.utils import log_metric

ROOT = Path(__file__).resolve().parents[1]
BOARD_ARTIFACTS = ROOT / "artifacts" / "board"


def build(month: str) -> Path:
    out_dir = BOARD_ARTIFACTS / f"pack_{month.replace('-', '')}"
    out_dir.mkdir(parents=True, exist_ok=True)
    kpis = compute(month)
    (out_dir / "index.md").write_text(f"# Board Pack {month}\n")
    kpi_lines = [f"- {row['id']}: {row['value']} {row['unit']}" for row in kpis]
    (out_dir / "kpi_table.md").write_text("\n".join(kpi_lines))
    (out_dir / "risks.md").write_text("No major risks")
    (out_dir / "program_roadmap.md").write_text("Roadmap TBD")
    (out_dir / "finance.md").write_text("See KPI table")
import json
from datetime import datetime

from ir import kpi_sot
from ir.utils import IR_ARTIFACTS, log_metric

BOARD_ARTIFACTS = Path(__file__).resolve().parents[1] / "artifacts" / "board"
BOARD_ARTIFACTS.mkdir(parents=True, exist_ok=True)


def build(month: str) -> Path:
    period = f"{month[:4]}Q{(int(month[5:7])-1)//3 + 1}"
    kpis = {r["id"]: r["value"] for r in kpi_sot.compute(period)}
    out_dir = BOARD_ARTIFACTS / f"pack_{month.replace('-', '')}"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "index.md").write_text(f"# Board Pack {month}\n")
    kpi_lines = "\n".join(f"- {k}: {v}" for k, v in kpis.items())
    (out_dir / "kpi_table.md").write_text(kpi_lines)
    (out_dir / "risks.md").write_text("No current risks\n")
    (out_dir / "program_roadmap.md").write_text("No current programs\n")
    (out_dir / "finance.md").write_text(f"Revenue {kpis.get('revenue')}\n")
    log_metric("board_pack_built")
    return out_dir
