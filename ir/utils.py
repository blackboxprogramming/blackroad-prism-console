from datetime import datetime
from pathlib import Path
from tools import storage

ROOT = Path(__file__).resolve().parents[1]
METRICS_PATH = ROOT / "artifacts" / "metrics.jsonl"

def log_metric(name: str) -> None:
    storage.write(str(METRICS_PATH), {"metric": name, "ts": datetime.utcnow().isoformat()})
