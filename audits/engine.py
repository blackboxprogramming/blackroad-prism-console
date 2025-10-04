import argparse
import datetime
import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

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


def load_jsonl_events(path: Optional[Path]) -> List[Dict[str, Any]]:
    events: List[Dict[str, Any]] = []
    if not path:
        return events
    if not path.exists():
        return events
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return events


def build_audit_events(
    report: Dict[str, Any], maintenance_events: Sequence[Dict[str, Any]]
) -> Iterable[Dict[str, Any]]:
    timestamp = report.get("timestamp")
    checks: Sequence[Dict[str, Any]] = report.get("checks", [])
    for check in checks:
        yield {
            "event": "audit.check",
            "timestamp": timestamp,
            "name": check.get("name"),
            "passed": check.get("passed"),
            "evidence_hash": check.get("evidence_hash"),
        }

    total = len(checks)
    passing = sum(1 for c in checks if c.get("passed"))
    yield {
        "event": "audit.summary",
        "timestamp": timestamp,
        "lucidia_trigger": report.get("lucidia_trigger"),
        "total_checks": total,
        "passed_checks": passing,
        "failed_checks": total - passing,
    }

    for event in maintenance_events:
        normalized = dict(event)
        normalized.setdefault("event", normalized.get("type", "maintenance.unknown"))
        yield normalized


def write_jsonl(events: Iterable[Dict[str, Any]], path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for event in events:
            f.write(json.dumps(event))
            f.write("\n")
    return path


def lucidia_trigger(results: List[Dict[str, Any]]) -> str:
    if any(not r["passed"] for r in results):
        return "spiral"
    return "anchor"


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run audit checks and emit reports")
    parser.add_argument(
        "--report-dir",
        type=Path,
        default=REPORT_DIR,
        help="Directory where the JSON audit report will be written.",
    )
    parser.add_argument(
        "--jsonl",
        type=Path,
        help="Optional path to emit audit events as JSON lines.",
    )
    parser.add_argument(
        "--maintenance-log",
        type=Path,
        help="Optional maintenance events JSONL to append into the audit stream.",
    )
    return parser.parse_args(argv)


def main(argv: Optional[Sequence[str]] = None) -> Tuple[Path, Optional[Path]]:
    args = parse_args(argv)
    defs = load_definitions()
    results = run_checks(defs)
    report = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "checks": results,
        "lucidia_trigger": lucidia_trigger(results),
    }
    serialized = json.dumps(report, indent=2)
    report["signature"] = hashlib.sha256(serialized.encode()).hexdigest()
    args.report_dir.mkdir(parents=True, exist_ok=True)
    report_path = args.report_dir / f"{report['timestamp']}.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    jsonl_path: Optional[Path] = None
    if args.jsonl:
        maintenance_events = load_jsonl_events(args.maintenance_log)
        events = build_audit_events(report, maintenance_events)
        jsonl_path = write_jsonl(events, args.jsonl)
    return report_path, jsonl_path


if __name__ == "__main__":
    report_path, jsonl_path = main()
    message = f"Audit report written to {report_path}"
    if jsonl_path:
        message += f"; JSONL stream at {jsonl_path}"
    print(message)
