from __future__ import annotations

from pathlib import Path
from typing import Optional

from tools import storage
from . import routing
from plm import bom

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "wi"


def render(item: str, rev: str) -> Path:
    key = f"{item}_{rev}"
    rt = routing.ROUTINGS.get(key)
    if not rt:
        raise ValueError("routing not loaded")
    if (item, rev) not in bom.BOMS:
        raise RuntimeError("DUTY_REV_MISMATCH")
    lines = [f"# Work Instructions for {item} rev {rev}\n"]
    for idx, step in enumerate(rt.steps, 1):
        lines.append(f"{idx}. {step.op} at {step.wc} - {step.std_time_min} min")
    ART_DIR.mkdir(parents=True, exist_ok=True)
    md_path = ART_DIR / f"{item}_{rev}.md"
    storage.write(str(md_path), "\n".join(lines))
    html_path = ART_DIR / f"{item}_{rev}.html"
    html = "<html><body><pre>" + "\n".join(lines) + "</pre></body></html>"
    storage.write(str(html_path), html)
    return md_path
