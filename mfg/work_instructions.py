from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict

from orchestrator import metrics
from tools import artifacts, storage

from plm import bom
from . import routing

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "wi"
SCHEMA = ROOT / "contracts" / "schemas" / "mfg_wi.schema.json"


def render(item: str, rev: str) -> Path:
    rt = routing.get_routing(item, rev)
    if not rt:
        raise ValueError("routing not loaded")
    if not bom.get_bom(item, rev):
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
    routing_dir = ROOT / "fixtures" / "mfg" / "routings"
    expected_yaml = routing_dir / f"{item}_{rev}.yaml"
    if not expected_yaml.exists():
        raise RuntimeError("DUTY_REV_MISMATCH")
    ART_DIR.mkdir(parents=True, exist_ok=True)
    md_path = ART_DIR / f"{item}_{rev}.md"
    artifacts.validate_and_write(str(md_path), "\n".join(lines))
    html_path = ART_DIR / f"{item}_{rev}.html"
    html = "<html><body><pre>" + "\n".join(lines) + "</pre></body></html>"
    artifacts.validate_and_write(str(html_path), html)

    manifest_path = ART_DIR / "index.json"
    if manifest_path.exists():
        try:
            manifest_raw = storage.read(str(manifest_path))
            manifest = json.loads(manifest_raw) if manifest_raw else {}
        except json.JSONDecodeError:
            manifest = {}
    else:
        manifest = {}
    manifest[f"{item}_{rev}"] = {
        "item": item,
        "rev": rev,
        "steps": len(rt.steps),
        "markdown": str(md_path),
        "html": str(html_path),
    }
    artifacts.validate_and_write(str(manifest_path), manifest, str(SCHEMA))
    metrics.inc("wi_rendered")
    ART_DIR.mkdir(parents=True, exist_ok=True)
    md_path = ART_DIR / f"{item}_{rev}.md"
    storage.write(str(md_path), "\n".join(lines))
    html_path = ART_DIR / f"{item}_{rev}.html"
    html = "<html><body><pre>" + "\n".join(lines) + "</pre></body></html>"
    storage.write(str(html_path), html)
    return md_path
