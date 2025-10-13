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
    log_metric("board_pack_built")
    return out_dir
