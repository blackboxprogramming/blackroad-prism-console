import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List

import yaml

from tools import artifacts, metrics, storage

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures/marketing"
ARTIFACTS_DIR = ROOT / "artifacts/marketing"
LAKE = ROOT / "artifacts/lake"
CONTRACTS = ROOT / "contracts/schemas"

NOW = datetime(2025, 1, 3)


def _load_contacts() -> Dict[str, dict]:
    contacts: Dict[str, dict] = {}
    with open(FIXTURES / "contacts.csv", newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            contacts[row["id"]] = row
    return contacts


def _load_events() -> Dict[str, List[dict]]:
    events: Dict[str, List[dict]] = {}
    for line in storage.read(str(FIXTURES / "events.jsonl")).splitlines():
        if not line:
            continue
        ev = json.loads(line)
        events.setdefault(ev["contact_id"], []).append(ev)
    return events


def _load_web() -> Dict[str, List[dict]]:
    web: Dict[str, List[dict]] = {}
    for line in storage.read(str(FIXTURES / "web_utm.jsonl")).splitlines():
        if not line:
            continue
        ev = json.loads(line)
        web.setdefault(ev["contact_id"], []).append(ev)
    return web


def build_segments(config_path: str) -> dict:
    cfg = yaml.safe_load(Path(config_path).read_text())
    contacts = _load_contacts()
    events = _load_events()
    web = _load_web()
    segments: Dict[str, List[str]] = {}
    for name, scfg in cfg.get("segments", {}).items():
        filt = scfg.get("filters", {})
        members: List[str] = []
        for cid, c in contacts.items():
            if filt.get("country") and c.get("country") != filt["country"]:
                continue
            if filt.get("has_event"):
                evs = [e for e in events.get(cid, []) if e.get("type") == filt["has_event"]]
                if not evs:
                    continue
            if filt.get("recency_days"):
                evs = events.get(cid, [])
                if not evs:
                    continue
                last = max(datetime.fromisoformat(e["ts"]) for e in evs)
                if (NOW - last).days > int(filt["recency_days"]):
                    continue
            if filt.get("utm_source"):
                w = [w for w in web.get(cid, []) if w.get("source") == filt["utm_source"]]
                if not w:
                    continue
            members.append(cid)
        segments[name] = members
    artifacts.validate_and_write(
        str(ARTIFACTS_DIR / "segments.json"), segments
    )
    lines = [f"# Segments"]
    for name, ids in segments.items():
        lines.append(f"- {name}: {len(ids)} members")
        for cid in ids:
            rec = {"segment": name, "contact_id": cid}
            artifacts.validate_and_write(
                str(LAKE / "audience_segments.jsonl"),
                rec,
                schema_path=str(CONTRACTS / "audience_segments.schema.json"),
            )
    storage.write(str(ARTIFACTS_DIR / "segments.md"), "\n".join(lines))
    metrics.emit("segments_built", len(segments))
    return segments
