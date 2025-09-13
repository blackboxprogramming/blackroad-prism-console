from __future__ import annotations

import json
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from tools import artifacts, metrics, storage

from . import dsl
from services.catalog import load_services


def _now() -> str:
    return datetime.utcnow().isoformat()


def _query_metric(params: Dict[str, Any]) -> float:
    metric = params["metric"]
    service = params["service"]
    services = load_services()
    svc = next((s for s in services if s.id == service), None)
    return float(svc.sli.get(metric, 0.0)) if svc else 0.0


def run(file: str) -> str:
    rb = dsl.load(file)
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    run_dir = Path(f"artifacts/runbooks/{rb.name}/run_{ts}")
    logs_path = run_dir / "log.jsonl"
    summary_path = run_dir / "summary.md"
    run_dir.mkdir(parents=True, exist_ok=True)
    ctx: Dict[str, Any] = {}
    code = "OK"
    for step in rb.steps:
        record: Dict[str, Any] = {"ts": _now(), "action": step.action, "status": "ok"}
        try:
            if step.action == "query_metric":
                value = _query_metric(step.params)
                ctx["value"] = value
                record["value"] = value
            elif step.action == "gate":
                cond = step.params.get("when", "")
                if not eval(cond, {}, ctx):
                    record["status"] = "fail"
                    code = step.params.get("on_fail", "abort:RB_GATE_FAIL").split(":", 1)[1]
                    artifacts.validate_and_write(str(logs_path), record, "schemas/runbook_run.schema.json")
                    break
            elif step.action == "create_task":
                record["task"] = step.params
            elif step.action == "notify":
                record["notify"] = step.params
            elif step.action == "sleep_ms":
                time.sleep(step.params.get("ms", 0) / 1000.0)
            elif step.action == "write_artifact":
                path = step.params["path"]
                content = step.params.get("content", "")
                storage.write(path, content)
            else:
                record["status"] = "unknown"
        except Exception:
            record["status"] = "error"
            code = "RB_STEP_ERROR"
            artifacts.validate_and_write(str(logs_path), record, "schemas/runbook_run.schema.json")
            break
        artifacts.validate_and_write(str(logs_path), record, "schemas/runbook_run.schema.json")
    summary = f"Runbook {rb.name} completed with code {code}"
    artifacts.validate_and_write(str(summary_path), summary, "schemas/status.schema.json")
    metrics.emit("runbook_run", 1)
    return code


def list_examples() -> list[str]:
    p = Path("runbooks/examples")
    return [f.name for f in p.glob("*.yaml")]
