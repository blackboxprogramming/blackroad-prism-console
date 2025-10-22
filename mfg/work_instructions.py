import os, argparse
from datetime import datetime

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
ART_DIR = os.path.join('artifacts','mfg','wi')
os.makedirs(ART_DIR, exist_ok=True)

HTML_HEAD = """<meta charset='utf-8'><style>body{font-family:ui-monospace,monospace;max-width:720px;margin:2rem auto;line-height:1.5}</style>"""


def render(item: str, rev: str, routing: dict | None = None):
    # DUTY_REV_MISMATCH simple check (expect routing file with same rev)
    routing_dir = os.path.join('fixtures','mfg','routings')
    expected_yaml = os.path.join(routing_dir, f"{item}_{rev}.yaml")
    if not os.path.exists(expected_yaml):
        raise SystemExit("DUTY_REV_MISMATCH: routing & BOM revs mismatch or missing routing fixture")

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
    fname_md = os.path.join(ART_DIR, f"{item}_{rev}.md")
    fname_html = os.path.join(ART_DIR, f"{item}_{rev}.html")
    md = f"""# Work Instructions — {item} rev {rev}\n\n- Revision: {rev}\n- Generated: {datetime.utcnow().isoformat()}Z\n\n## Safety\n- ESD protection required.\n\n## Steps\n1. Kitting per MRP.\n2. Assemble per routing.\n3. Torque per table.\n"""
    with open(fname_md,'w') as f: f.write(md)
    with open(fname_html,'w') as f: f.write(HTML_HEAD+md.replace('\n','<br/>'))
    print(f"wi_rendered=1 -> {fname_md}")

# CLI

def cli_wi_render(argv):
    p = argparse.ArgumentParser(prog='mfg:wi:render')
    p.add_argument('--item', required=True)
    p.add_argument('--rev', required=True)
    a = p.parse_args(argv)
    render(a.item, a.rev, None)
