import json
from datetime import datetime
from pathlib import Path
from typing import Dict

import yaml

PLAYBOOK_DIR = Path(__file__).resolve().parent.parent / "resilience" / "playbooks"
MEMORY_FILE = Path(__file__).with_name("memory.log")

SCENARIOS: Dict[str, str] = {
    "api_outage": "incident_response.yaml",
    "db_crash": "disaster_recovery.yaml",
}


def simulate() -> Dict[str, bool]:
    results = {}
    for name, pb in SCENARIOS.items():
        pb_path = PLAYBOOK_DIR / pb
        triggered = pb_path.exists() and _has_procedure(pb_path)
        results[name] = triggered
    return results


def _has_procedure(path: Path) -> bool:
    try:
        data = yaml.safe_load(path.read_text())
        return bool(data.get("procedure"))
    except Exception:
        return False


def log_results(results: Dict[str, bool]) -> None:
    MEMORY_FILE.parent.mkdir(exist_ok=True)
    entry = {"timestamp": datetime.utcnow().isoformat(), "results": results}
    with open(MEMORY_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


def main() -> Dict[str, bool]:
    results = simulate()
    log_results(results)
    return results


if __name__ == "__main__":
    for scenario, ok in main().items():
        print(f"{scenario}: {'triggered' if ok else 'missing playbook'}")
