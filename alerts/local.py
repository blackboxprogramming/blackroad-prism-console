import json
from datetime import datetime
from pathlib import Path
from typing import List

from tools import storage

from analytics.utils import increment, log_event

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "artifacts" / "alerts"
SEVERITY_ORDER = {"low": 1, "medium": 2, "high": 3, "critical": 4}


def trigger(source: str, file: Path, min_severity: str) -> List[dict]:
    data = json.loads(file.read_text())
    ART.mkdir(parents=True, exist_ok=True)
    emitted: List[dict] = []
    for item in data:
        if SEVERITY_ORDER[item["severity"]] >= SEVERITY_ORDER[min_severity]:
            event = {
                "ts": datetime.utcnow().isoformat(),
                "source": source,
                "severity": item["severity"],
                "message": f"{item['metric']} {item['group']}",
            }
            storage.write(str(ART / "alerts.jsonl"), event)
            emitted.append(event)
            print(f"{event['severity'].upper()}: {event['message']}")
    if emitted:
        increment("alerts_emitted")
        log_event({"type": "alert", "source": source, "count": len(emitted)})
    return emitted


def list_alerts(limit: int = 20) -> List[dict]:
    path = ART / "alerts.jsonl"
    if not path.exists():
        return []
    lines = path.read_text().strip().splitlines()[-limit:]
    return [json.loads(l) for l in lines]
