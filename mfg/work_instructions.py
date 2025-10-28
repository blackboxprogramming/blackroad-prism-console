"""Generate lightweight work instructions for unit tests.

The goal is to create predictable Markdown and HTML outputs so the
pytest suite can assert on their presence.  The implementation deliberately
avoids coupling to the wider manufacturing modules.
"""

from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, Optional

ART_DIR: Path = Path("artifacts/mfg/wi")


def _ensure_art_dir() -> Path:
    path = Path(ART_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path

import json
import os
from dataclasses import asdict
from pathlib import Path

from tools import storage, artifacts
from . import routing
from plm import bom
from orchestrator import metrics

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "wi"
LAKE_DIR = ROOT / "artifacts" / "mfg" / "lake"
SCHEMA_DIR = ROOT / "contracts" / "schemas"
INDEX_PATH = ROOT / "artifacts" / "mfg" / "wi_index.json"

def _format_steps(steps: Iterable[str]) -> str:
    lines = []
    for index, step in enumerate(steps, 1):
        lines.append(f"{index}. {step}")
    return "\n".join(lines) if lines else "1. Assemble per routing"


def render(item: str, rev: str, routing: Optional[Dict[str, object]] = None) -> Path:
    """Render Markdown and HTML work instructions for ``item``/``rev``."""

    art_dir = _ensure_art_dir()
    key = f"{item}_{rev}"

    routing_steps = []
    if routing and isinstance(routing.get("steps"), list):
        for step in routing["steps"]:
            if isinstance(step, dict):
                label = step.get("op") or step.get("description") or "Unnamed step"
                wc = step.get("wc")
                if wc:
                    label = f"{label} @ {wc}"
                routing_steps.append(str(label))
            else:
                routing_steps.append(str(step))

    timestamp = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    summary_lines = [
        f"# Work Instructions — {item} rev {rev}",
        "",
        f"Generated: {timestamp}",
        "",
        "## Steps",
        _format_steps(routing_steps),
    ]
    markdown = "\n".join(summary_lines) + "\n"

    md_path = art_dir / f"{key}.md"
    html_path = art_dir / f"{key}.html"
    md_path.write_text(markdown, encoding="utf-8")
    html_path.write_text(f"<html><body><pre>{markdown}</pre></body></html>", encoding="utf-8")
    rt = routing.ROUTINGS.get(key)
    if not rt:
        raise ValueError("routing not loaded")
    if (item, rev) not in bom.BOMS:
        raise RuntimeError("DUTY_REV_MISMATCH")
    lines = [f"# Work Instructions for {item} rev {rev}\n"]
    for idx, step in enumerate(rt.steps, 1):
        lines.append(f"{idx}. {step.op} at {step.wc} - {step.std_time_min} min")
    routing_key = f"{item}_{rev}"
    routing_dir = os.path.join("fixtures", "mfg", "routings")
    expected_yaml = os.path.join(routing_dir, f"{item}_{rev}.yaml")
    if not os.path.exists(expected_yaml):
        raise SystemExit(
            "DUTY_REV_MISMATCH: routing & BOM revs mismatch or missing routing fixture"
        )
    ART_DIR.mkdir(parents=True, exist_ok=True)
    md_path = ART_DIR / f"{item}_{rev}.md"
    storage.write(str(md_path), "\n".join(lines))
    html_path = ART_DIR / f"{item}_{rev}.html"
    html = "<html><body><pre>" + "\n".join(lines) + "</pre></body></html>"
    storage.write(str(html_path), html)

    record = {
        "item": item,
        "rev": rev,
        "steps": [asdict(step) for step in rt.steps],
        "markdown": str(md_path.relative_to(ROOT)),
        "html": str(html_path.relative_to(ROOT)),
    }

    raw = storage.read(str(INDEX_PATH))
    index = json.loads(raw) if raw else []
    index = [row for row in index if row.get("item") != item or row.get("rev") != rev]
    index.append(record)
    index.sort(key=lambda r: (r["item"], r["rev"]))
    artifacts.validate_and_write(
        str(INDEX_PATH),
        index,
        str(SCHEMA_DIR / "mfg_wi.schema.json"),
    )

    LAKE_DIR.mkdir(parents=True, exist_ok=True)
    lake_path = LAKE_DIR / "mfg_wi.jsonl"
    if lake_path.exists():
        lake_path.unlink()
    for row in index:
        storage.write(str(lake_path), row)

    metrics.inc("wi_rendered")
    return md_path


def cli_wi_render(argv: Optional[list[str]] = None) -> Path:
    parser = argparse.ArgumentParser(prog="mfg:wi:render", description="Render work instructions")
    parser.add_argument("--item", required=True)
    parser.add_argument("--rev", required=True)
    args = parser.parse_args(argv)
    return render(args.item, args.rev)


__all__ = ["render", "cli_wi_render", "ART_DIR"]
