import uuid
from pathlib import Path
from typing import Any, Dict, List

import yaml

from sdk import plugin_api
from orchestrator import route
from metrics import record
from prism_io.validate import validate_json


def _eval_when(expr: str, context: Dict[str, Any]) -> bool:
    if not expr:
        return True
    expr = expr.strip()
    if expr.startswith("{{") and expr.endswith("}}"):  # very small template engine
        expr = expr[2:-2].strip()
    try:
        return bool(eval(expr, {"__builtins__": {}}, context))
    except Exception:
        return False


def run_workflow(yaml_path: str) -> Dict[str, Any]:
    with open(yaml_path) as f:
        spec = yaml.safe_load(f)
    steps_spec = spec.get("steps", [])
    results: List[Dict[str, Any]] = []
    for step in steps_spec:
        ctx = {"steps": results}
        if "bot" in step:
            if not _eval_when(step.get("when"), ctx):
                results.append({"skipped": True})
                continue
            task = plugin_api.Task(intent=step.get("intent", ""), inputs=step.get("inputs", {}))
            validate_json(task.__dict__, "task")
            resp = route(step["bot"], task)
            validate_json(resp.__dict__, "bot_response")
            results.append({"ok": resp.ok, "content": resp.content, "data": resp.data})
        elif "gather" in step:
            summary = "\n".join(r.get("content", "") for r in results if r.get("content"))
            results.append({"gather": step["gather"], "summary": summary})
    record("workflow_run")
    return {"steps": results}


def write_summary(workflow_id: str, summary: str) -> Path:
    path = Path("artifacts") / workflow_id
    path.mkdir(parents=True, exist_ok=True)
    out = path / "summary.md"
    out.write_text(summary)
    return out
