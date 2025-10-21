from __future__ import annotations

import json
from collections import defaultdict, deque
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Deque, Dict, List

from .rules import Rule, load_rules
from .. import utils


def _parse_ts(ts: str) -> datetime:
    return datetime.fromisoformat(ts)


def _window_to_timedelta(window: str) -> timedelta:
    if window.endswith("m"):
        return timedelta(minutes=int(window[:-1]))
    raise ValueError(f"unsupported window {window}")


def run(rules_dir: Path, logs_dir: Path) -> Dict[str, List[dict]]:
    rules = load_rules(rules_dir)
    all_results: Dict[str, List[dict]] = {}
    run_ts = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    det_dir = utils.ARTIFACT_DIR / "detections"
    summary_lines: List[str] = []

    for rule in rules:
        log_path = logs_dir / rule.source
        detections: List[dict] = []
        fail_history: Dict[str, Dict[Any, Deque[datetime]]] = defaultdict(lambda: defaultdict(deque))
        with log_path.open("r", encoding="utf-8") as f:
            for line in f:
                rec = json.loads(line)
                rec_ts = _parse_ts(rec["ts"])
                # update fail history
                if rec.get("result") == "FAIL":
                    for field, value in rec.items():
                        if field == "ts":
                            continue
                        fail_history[field][value].append(rec_ts)
                env = rec.copy()

                def count_fail(field: str, window: str) -> int:
                    delta = _window_to_timedelta(window)
                    value = rec.get(field)
                    dq = fail_history[field][value]
                    while dq and rec_ts - dq[0] > delta:
                        dq.popleft()
                    return len(dq)

                env.update({
                    "count_fail": count_fail,
                })
                if eval(rule.where, {"__builtins__": {}}, env):
                    det = {k: rec.get(k) for k in rule.select}
                    det.update({"rule": rule.name, "severity": rule.severity, "ts": rec["ts"]})
                    detections.append(det)
        out_path = det_dir / f"{rule.name}_{run_ts}.json"
        utils.write_json(out_path, detections)
        utils.record_metric("sec_detection_fired", len(detections))
        summary_lines.append(f"{rule.name}: {len(detections)} detections")
        all_results[rule.name] = detections

    summary_path = det_dir / f"summary_{run_ts}.md"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    with summary_path.open("w", encoding="utf-8") as f:
        f.write("\n".join(summary_lines))

    return all_results
