from __future__ import annotations

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
