import csv
import json
from pathlib import Path
from typing import Dict, List

from tools import artifacts, metrics, storage

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures/marketing"
ARTIFACTS_DIR = ROOT / "artifacts/marketing/attribution"
LAKE = ROOT / "artifacts/lake"
CONTRACTS = ROOT / "contracts/schemas"


def _touches() -> Dict[str, List[dict]]:
    touches: Dict[str, List[dict]] = {}
    for line in storage.read(str(FIXTURES / "web_utm.jsonl")).splitlines():
        if not line:
            continue
        ev = json.loads(line)
        touches.setdefault(ev["contact_id"], []).append(ev)
    return touches


def _conversions() -> Dict[str, str]:
    conv: Dict[str, str] = {}
    for line in storage.read(str(FIXTURES / "events.jsonl")).splitlines():
        if not line:
            continue
        ev = json.loads(line)
        if ev.get("type") == "demo_request":
            conv[ev["contact_id"]] = ev["ts"]
    return conv


def _alloc(model: str, touches: List[dict]) -> Dict[str, float]:
    if not touches:
        return {}
    channels = [t["source"] for t in touches]
    if model == "last":
        return {channels[-1]: 1.0}
    if model == "first":
        return {channels[0]: 1.0}
    if model == "linear":
        share = 1 / len(channels)
        return {c: share for c in channels}
    if model == "position":
        if len(channels) == 1:
            return {channels[0]: 1.0}
        first, last = channels[0], channels[-1]
        middle = channels[1:-1]
        res = {first: 0.4, last: 0.4}
        if middle:
            share = 0.2 / len(middle)
            for m in middle:
                res[m] = res.get(m, 0) + share
        return res
    raise ValueError("unknown model")


def run_attribution(model: str) -> None:
    touches = _touches()
    conv = _conversions()
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    rows: List[dict] = []
    summary: Dict[str, float] = {}
    for cid, ts in conv.items():
        tchs = sorted(touches.get(cid, []), key=lambda x: x["ts"])
        alloc = _alloc(model, tchs)
        for ch, credit in alloc.items():
            rows.append({"contact_id": cid, "channel": ch, "credit": credit})
            summary[ch] = summary.get(ch, 0) + credit
            rec = {"contact_id": cid, "model": model, "channel": ch, "credit": credit}
            artifacts.validate_and_write(
                str(LAKE / "attribution.jsonl"),
                rec,
                schema_path=str(CONTRACTS / "attribution.schema.json"),
            )
    out = ARTIFACTS_DIR / f"{model}.csv"
    with open(out, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["contact_id", "channel", "credit"])
        w.writeheader()
        w.writerows(rows)
    lines = ["# Attribution Summary"]
    for ch, val in summary.items():
        lines.append(f"- {ch}: {val}")
    storage.write(str(ARTIFACTS_DIR / "summary.md"), "\n".join(lines))
    metrics.emit("attribution_run")
