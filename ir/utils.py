from pathlib import Path
from datetime import datetime
import json

ROOT = Path(__file__).resolve().parents[1]
IR_ARTIFACTS = ROOT / "artifacts" / "ir"
IR_ARTIFACTS.mkdir(parents=True, exist_ok=True)

METRICS_PATH = IR_ARTIFACTS / "metrics.jsonl"

def log_metric(name: str) -> None:
    entry = {"metric": name, "time": datetime.utcnow().isoformat()}
    with METRICS_PATH.open("a") as f:
        f.write(json.dumps(entry) + "\n")
