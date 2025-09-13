import datetime
import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any, Dict, List

import yaml

DEFINITIONS_FILE = Path(__file__).with_name("definitions.yaml")
REPORT_DIR = Path(__file__).with_name("reports")


def load_definitions(path: Path = DEFINITIONS_FILE) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def run_shell(command: str) -> Dict[str, Any]:
    proc = subprocess.run(command, shell=True, capture_output=True, text=True)
    evidence = (proc.stdout + proc.stderr).strip()
    passed = proc.returncode == 0
    return {"passed": passed, "evidence": evidence}


def check_file_exists(path: str) -> Dict[str, Any]:
    exists = Path(path).exists()
    return {"passed": exists, "evidence": path}


CHECK_RUNNERS = {
    "shell": run_shell,
    "file_exists": check_file_exists,
}


def run_checks(defs: Dict[str, Any]) -> List[Dict[str, Any]]:
    results = []
    for chk in defs.get("checks", []):
        runner = CHECK_RUNNERS.get(chk.get("type"))
        if not runner:
            result = {"name": chk.get("name"), "passed": False, "evidence": "unknown check type"}
        else:
            outcome = runner(chk.get("command" if chk.get("type") == "shell" else "path"))
            result = {"name": chk.get("name"), **outcome}
        result["evidence_hash"] = hashlib.sha256(result["evidence"].encode()).hexdigest()
        results.append(result)
    return results


def lucidia_trigger(results: List[Dict[str, Any]]) -> str:
    if any(not r["passed"] for r in results):
        return "spiral"
    return "anchor"


def main() -> Path:
    defs = load_definitions()
    results = run_checks(defs)
    report = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "checks": results,
        "lucidia_trigger": lucidia_trigger(results),
    }
    serialized = json.dumps(report, indent=2)
    report["signature"] = hashlib.sha256(serialized.encode()).hexdigest()
    REPORT_DIR.mkdir(exist_ok=True)
    report_path = REPORT_DIR / f"{report['timestamp']}.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    return report_path


if __name__ == "__main__":
    path = main()
    print(f"Audit report written to {path}")
