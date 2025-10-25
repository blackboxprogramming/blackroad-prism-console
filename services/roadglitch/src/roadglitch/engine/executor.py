from __future__ import annotations

import asyncio
import json
from typing import Any, Dict

from ..observability.logging import get_logger
from ..observability import metrics
from ..repo import RunRepository
from .dag import topological_sort
from .policies import resolve_retry_policy
from .templating import render_template
from .types import WorkflowSpec
from ..connectors.registry import get_connector

logger = get_logger(__name__)


class ExecutionContext:
    def __init__(self, run_id: int, workflow: WorkflowSpec, input_payload: Dict[str, Any]):
        self.run_id = run_id
        self.workflow = workflow
        self.input = input_payload
        self.node_results: Dict[str, Dict[str, Any]] = {}

    def build_eval_context(self) -> Dict[str, Any]:
        return {
            "input": self.input,
            "nodes": {node_id: result for node_id, result in self.node_results.items()},
            "ctx": {"run_id": self.run_id},
        }


async def execute_workflow(
    *,
    run_repo: RunRepository,
    run_id: int,
    workflow_spec: WorkflowSpec,
    input_payload: Dict[str, Any],
) -> Dict[str, Any]:
    context = ExecutionContext(run_id, workflow_spec, input_payload)
    ordered_nodes = topological_sort(workflow_spec)
    logs: list[str] = []
    run_status = "succeeded"
    start_time = asyncio.get_event_loop().time()
    try:
        for node_id in ordered_nodes:
            node_spec = workflow_spec.graph.nodes[node_id]
            eval_context = context.build_eval_context()
            if node_spec.if_:
                condition = eval(node_spec.if_, {"__builtins__": {}}, eval_context)  # noqa: S307
                if not condition:
                    logs.append(json.dumps({"node": node_id, "skipped": True}))
                    continue
            policy = resolve_retry_policy(node_id, node_spec, workflow_spec.policies)
            attempt = 0
            while attempt < policy.max_attempts:
                attempt += 1
                try:
                    rendered_params = render_template(node_spec.with_, eval_context)
                    connector = get_connector(node_spec.uses)
                    with metrics.observe_node(connector=node_spec.uses, status="success"):
                        result = await connector.execute(
                            context={"run_id": run_id, "attempt": attempt}, params=rendered_params
                        )
                    context.node_results[node_id] = result
                    logs.append(json.dumps({"node": node_id, "status": "succeeded", "attempt": attempt}))
                    break
                except Exception as exc:  # pragma: no cover - best effort logging
                    with metrics.observe_node(connector=node_spec.uses, status="failed"):
                        pass
                    logs.append(
                        json.dumps({"node": node_id, "status": "failed", "attempt": attempt, "error": str(exc)})
                    )
                    if attempt >= policy.max_attempts:
                        run_status = "failed"
                        raise
                    await policy.backoff(attempt)
    finally:
        run_repo.append_logs(run_id, logs)
        duration = asyncio.get_event_loop().time() - start_time
        metrics.RUNS_TOTAL.labels(status=run_status).inc()
        metrics.RUN_DURATION.labels(status=run_status).observe(duration)
    if run_status == "failed":
        raise RuntimeError("Workflow execution failed")
    return context.node_results


__all__ = ["execute_workflow"]

