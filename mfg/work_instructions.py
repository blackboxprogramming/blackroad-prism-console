from __future__ import annotations

from pathlib import Path

from plm import bom
from tools import storage

from . import routing

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "wi"
ROUTING_FIXTURES = ROOT / "fixtures" / "mfg" / "routings"


def _ensure_routing_fixture_exists(key: str) -> None:
    """Validate that a routing fixture exists for the requested item revision."""

    fixture_path = ROUTING_FIXTURES / f"{key}.yaml"
    if not fixture_path.exists():
        raise RuntimeError("DUTY_REV_MISMATCH")


def render(item: str, rev: str) -> Path:
    key = f"{item}_{rev}"
    routing_entry = routing.ROUTINGS.get(key)
    if routing_entry is None:
        raise ValueError("routing not loaded")
    if (item, rev) not in bom.BOMS:
        raise RuntimeError("DUTY_REV_MISMATCH")
    _ensure_routing_fixture_exists(key)

    lines = [f"# Work Instructions for {item} rev {rev}"]
    for idx, step in enumerate(routing_entry.steps, 1):
        detail = f"{idx}. {step.op} at {step.wc} - {step.std_time_min} min"
        lines.append(detail)

    ART_DIR.mkdir(parents=True, exist_ok=True)
    content = "\n".join(lines)
    md_path = ART_DIR / f"{key}.md"
    storage.write(str(md_path), content)
    html_path = ART_DIR / f"{key}.html"
    html = f"<html><body><pre>{content}</pre></body></html>"
    storage.write(str(html_path), html)
    return md_path
