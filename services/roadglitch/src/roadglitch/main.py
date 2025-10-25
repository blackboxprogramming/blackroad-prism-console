from __future__ import annotations

import asyncio
import json
from typing import Any, Dict

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
from prometheus_client import generate_latest

from .auth import verify_token
from .config import Settings, get_settings
from .engine.executor import execute_workflow
from .engine.dag import topological_sort
from .engine.types import WorkflowSpec
from .observability.logging import configure_logging, get_logger
from .repo import Database, RunRepository, WorkflowRepository

configure_logging()
logger = get_logger(__name__)

db = Database()
workflow_repo = WorkflowRepository(db)
run_repo = RunRepository(db)


class RateLimiter:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.tokens: Dict[str, list[float]] = {}
        self.lock = asyncio.Lock()

    async def check(self, identifier: str) -> bool:
        async with self.lock:
            from time import monotonic

            now = monotonic()
            window = 60.0
            allowed = self.settings.rate_limit_per_minute
            bucket = self.tokens.setdefault(identifier, [])
            bucket[:] = [timestamp for timestamp in bucket if now - timestamp < window]
            if len(bucket) >= allowed:
                return False
            bucket.append(now)
            return True

    async def reset(self) -> None:
        async with self.lock:
            self.tokens.clear()


rate_limiter = RateLimiter(get_settings())


async def rate_limit_dependency(request: Request) -> None:
    token = request.headers.get("authorization", "anonymous")
    if not await rate_limiter.check(token):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={"Retry-After": "60"},
        )


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_allow_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    router = APIRouter(dependencies=[Depends(rate_limit_dependency), Depends(verify_token)])

    @router.post("/workflows")
    async def create_workflow(payload: Dict[str, Any]) -> Dict[str, Any]:
        try:
            spec_model = WorkflowSpec.parse_obj(payload)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        workflow = workflow_repo.upsert(name=spec_model.name, version=spec_model.version, spec=json.dumps(payload))
        return {
            "id": workflow.id,
            "name": workflow.name,
            "version": workflow.version,
            "specDigest": workflow.spec_digest,
        }

    @router.get("/workflows/{workflow_id}")
    async def get_workflow(workflow_id: int) -> Dict[str, Any]:
        workflow = workflow_repo.get(workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return {"workflow": json.loads(workflow.spec)}

    @router.get("/workflows")
    async def list_workflows() -> Dict[str, Any]:
        items = workflow_repo.list()
        return {"items": [json.loads(item.spec) for item in items]}

    async def _dispatch_run(run_id: int, spec: WorkflowSpec, payload: Dict[str, Any]) -> None:
        run_repo.update_status(run_id, "running")
        try:
            result = await execute_workflow(run_repo=run_repo, run_id=run_id, workflow_spec=spec, input_payload=payload)
            run_repo.update_status(run_id, "succeeded", json.dumps(result))
        except Exception as exc:  # pragma: no cover - best effort logging
            run_repo.update_status(run_id, "failed", json.dumps({"error": str(exc)}))

    @router.post("/runs")
    async def start_run(request: Request, background: BackgroundTasks) -> Dict[str, Any]:
        body = await request.json()
        workflow_id = body.get("workflowId")
        name = body.get("name")
        version = body.get("version")
        input_payload = body.get("input", {})
        if workflow_id is not None:
            workflow = workflow_repo.get(int(workflow_id))
        elif name and version:
            workflow = workflow_repo.get_by_name_version(name, version)
        else:
            raise HTTPException(status_code=400, detail="workflowId or name+version required")
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        idempotency_key = request.headers.get("idempotency-key")
        if idempotency_key:
            existing = run_repo.find_by_idempotency(idempotency_key)
            if existing:
                return {"runId": existing.id}
        run = run_repo.create(workflow_id=workflow.id, input_payload=json.dumps(input_payload), idempotency_key=idempotency_key)
        run_repo.append_logs(
            run.id,
            [
                json.dumps(
                    {
                        "event": "run.created",
                        "workflowId": workflow.id,
                        "x-idempotency-key": idempotency_key,
                    }
                )
            ],
        )
        if idempotency_key:
            run_repo.upsert_idempotency(idempotency_key, body, run.id)
        spec_model = WorkflowSpec.parse_raw(workflow.spec)
        background.add_task(_dispatch_run, run.id, spec_model, input_payload)
        return {"runId": run.id}

    @router.get("/runs/{run_id}")
    async def get_run(run_id: int) -> Dict[str, Any]:
        run = run_repo.get(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        logs = run_repo.list_logs(run_id)
        return {
            "run": {
                "id": run.id,
                "status": run.status,
                "result": json.loads(run.result_payload) if run.result_payload else None,
                "logs": [json.loads(log.message) for log in logs],
            }
        }

    @router.post("/runs/{run_id}/cancel")
    async def cancel_run(run_id: int) -> Dict[str, Any]:
        run = run_repo.get(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        run_repo.update_status(run_id, "cancelled")
        return {"ok": True}

    @router.post("/validate")
    async def validate_workflow(payload: Dict[str, Any]) -> Dict[str, Any]:
        try:
            WorkflowSpec.parse_obj(payload)
            return {"valid": True}
        except Exception as exc:
            return {"valid": False, "errors": [str(exc)]}

    @router.post("/dry-run")
    async def dry_run(payload: Dict[str, Any]) -> Dict[str, Any]:
        spec = WorkflowSpec.parse_obj(payload)
        order = list(topological_sort(spec))
        return {"plan": {"nodes": order}}

    app.include_router(router)

    @app.get("/health")
    async def health(deps: None = Depends(rate_limit_dependency)) -> Dict[str, Any]:
        return {
            "status": "ok",
            "uptime": 0,
            "version": "0.1.0",
            "queueDepth": 0,
        }

    @app.get("/metrics")
    async def metrics_endpoint() -> Response:
        return Response(generate_latest(), media_type="text/plain; version=0.0.4")

    return app


app = create_app()

