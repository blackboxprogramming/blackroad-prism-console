from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Callable

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.responses import PlainTextResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from sqlalchemy.engine import make_url
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from .config import Settings, get_settings
from .middlewares.cors import cors_options
from .middlewares.rate_limit import RateLimitMiddleware
from .middlewares.request_id import RequestIDMiddleware
from .middlewares.security_headers import SecurityHeadersMiddleware
from .observability.logging import configure_logging, get_logger
from .observability.metrics import REQUEST_COUNT, REQUEST_LATENCY, REGISTRY, RUNBOOK_EXECUTIONS
from .repo import AgentRepository, MetricRepository, RunbookRepository
from .schemas.agents import AgentDetailResponse, AgentListResponse
from .schemas.dashboard import DashboardPayload, Metric as MetricSchema, Shortcut
from .schemas.runbooks import (
    RunbookExecuteRequest,
    RunbookExecuteResponse,
    RunbookListResponse,
    RunbookResponse,
)
from .seeds import seed_all
from .services.auth import AuthVerifier
from .services.proxy import RunbookProxy
from .services.sse import SSEBroadcaster
from .services.validation import ValidationError, validate_payload


logger = get_logger(__name__)


def create_engine_and_seed(settings: Settings):
    url = make_url(settings.db_url)
    if url.drivername.startswith("sqlite") and url.database and url.database != ":memory:":
        db_path = Path(url.database)
        if not db_path.is_absolute():
            db_path = Path.cwd() / db_path
        db_path.parent.mkdir(parents=True, exist_ok=True)
    engine_kwargs: dict[str, Any] = {}
    if url.drivername.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        if url.database in {None, ":memory:", ""}:
            engine_kwargs["poolclass"] = StaticPool
    engine = create_engine(settings.db_url, **engine_kwargs)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        seed_all(session)
    return engine


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level)

    engine = create_engine_and_seed(settings)

    def get_session() -> Session:
        with Session(engine) as session:
            yield session

    verifier = AuthVerifier(settings)
    runbook_proxy = RunbookProxy(settings)
    broadcaster = SSEBroadcaster("/api/stream/ops")

    app = FastAPI(title="Prism Console API", version="0.1.0")
    app.state.auth_verifier = verifier
    app.state.auth_cache: dict[str, dict[str, Any]] = {}
    app.state.runbook_proxy = runbook_proxy
    app.state.settings = settings
    app.state.broadcaster = broadcaster

    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(
        CORSMiddleware,
        **cors_options([str(origin) for origin in settings.cors_origins]),
    )

    @app.middleware("http")
    async def observe_requests(request: Request, call_next: Callable):  # type: ignore[override]
        route = request.url.path
        method = request.method
        with REQUEST_LATENCY.labels(route=route, method=method).time():
            response: Response = await call_next(request)
        REQUEST_COUNT.labels(route=route, method=method, status=str(response.status_code)).inc()
        return response

    async def require_auth(request: Request) -> dict[str, Any]:
        if request.url.path in {"/health", "/metrics", "/openapi.json"}:
            return {}
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
        token = auth_header.split(" ", 1)[1]
        cached = request.app.state.auth_cache.get(token)
        if cached:
            return cached
        payload = await verifier.verify(token)
        request.app.state.auth_cache[token] = payload
        return payload

    @app.on_event("shutdown")
    async def shutdown_event() -> None:
        await verifier.close()

    @app.get("/health")
    async def health() -> dict[str, Any]:
        return {
            "status": "ok",
            "uptime": "mock",
            "version": app.version,
            "db": "connected",
            "mocks": settings.mock_mode,
        }

    @app.get("/metrics")
    async def metrics() -> Response:
        data = generate_latest(REGISTRY)
        return PlainTextResponse(data.decode(), media_type=CONTENT_TYPE_LATEST)

    @app.get("/api/mobile/dashboard", response_model=DashboardPayload)
    async def get_dashboard(
        _: dict[str, Any] = Depends(require_auth),
        session: Session = Depends(get_session),
    ) -> DashboardPayload:
        metrics_repo = MetricRepository(session)
        metrics = [
            MetricSchema(
                id=m.metric_id,
                title=m.title,
                value=m.value,
                caption=m.caption,
                icon=m.icon,
                status=m.status,  # type: ignore[arg-type]
            )
            for m in metrics_repo.list_metrics()
        ]
        shortcuts = [
            Shortcut(id="runbooks", title="Runbooks", icon="book", url="https://console.blackroad.io/runbooks"),
            Shortcut(id="agents", title="Agents", icon="cpu", url="https://console.blackroad.io/agents"),
        ]
        return DashboardPayload(
            summary="Operational posture is nominal.",
            metrics=metrics,
            shortcuts=shortcuts,
        )

    @app.get("/api/agents", response_model=AgentListResponse)
    async def list_agents(
        _: dict[str, Any] = Depends(require_auth),
        session: Session = Depends(get_session),
    ) -> AgentListResponse:
        repo = AgentRepository(session)
        items = [
            {
                "id": agent.id,
                "name": agent.name,
                "domain": agent.domain,
                "status": agent.status,
                "memoryUsedMB": agent.memory_used_mb,
                "lastSeenAt": agent.last_seen_at,
                "version": agent.version,
            }
            for agent in repo.list_agents()
        ]
        return AgentListResponse(items=items)  # type: ignore[arg-type]

    @app.get("/api/agents/{agent_id}", response_model=AgentDetailResponse)
    async def get_agent(
        agent_id: str,
        _: dict[str, Any] = Depends(require_auth),
        session: Session = Depends(get_session),
    ) -> AgentDetailResponse:
        repo = AgentRepository(session)
        agent = repo.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
        recent = repo.recent_events(agent_id)
        agent_payload = {
            "id": agent.id,
            "name": agent.name,
            "domain": agent.domain,
            "status": agent.status,
            "memoryUsedMB": agent.memory_used_mb,
            "lastSeenAt": agent.last_seen_at,
            "version": agent.version,
        }
        recent_payload = [
            {
                "id": event.id,
                "agentId": event.agent_id,
                "kind": event.kind,
                "at": event.at,
                "message": event.message,
            }
            for event in recent
        ]
        return AgentDetailResponse(agent=agent_payload, recent=recent_payload)  # type: ignore[arg-type]

    @app.get("/api/runbooks", response_model=RunbookListResponse)
    async def list_runbooks(
        _: dict[str, Any] = Depends(require_auth),
        session: Session = Depends(get_session),
    ) -> RunbookListResponse:
        repo = RunbookRepository(session)
        items = []
        for runbook in repo.list_runbooks():
            items.append(
                {
                    "id": runbook.id,
                    "title": runbook.title,
                    "description": runbook.description,
                    "tags": runbook.tags.split(","),
                    "inputsSchema": json.loads(runbook.inputs_schema),
                    "linkedWorkflow": runbook.linked_workflow,
                }
            )
        return RunbookListResponse(items=items)  # type: ignore[arg-type]

    @app.get("/api/runbooks/{runbook_id}", response_model=RunbookResponse)
    async def get_runbook(
        runbook_id: str,
        _: dict[str, Any] = Depends(require_auth),
        session: Session = Depends(get_session),
    ) -> RunbookResponse:
        repo = RunbookRepository(session)
        runbook = repo.get_runbook(runbook_id)
        if not runbook:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Runbook not found")
        payload = {
            "id": runbook.id,
            "title": runbook.title,
            "description": runbook.description,
            "tags": runbook.tags.split(","),
            "inputsSchema": json.loads(runbook.inputs_schema),
            "linkedWorkflow": runbook.linked_workflow,
        }
        return RunbookResponse(runbook=payload)  # type: ignore[arg-type]

    @app.post("/api/runbooks/{runbook_id}/execute", response_model=RunbookExecuteResponse)
    async def execute_runbook(
        runbook_id: str,
        request_data: RunbookExecuteRequest,
        request: Request,
        _: dict[str, Any] = Depends(require_auth),
        session: Session = Depends(get_session),
    ) -> RunbookExecuteResponse:
        repo = RunbookRepository(session)
        runbook = repo.get_runbook(runbook_id)
        if not runbook:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Runbook not found")
        schema = json.loads(runbook.inputs_schema)
        payload = request_data.input or {}
        try:
            validate_payload(schema, payload)
        except ValidationError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        execution_payload = {
            "workflowName": runbook.linked_workflow,
            "input": payload,
        }
        headers = {
            "x-correlation-id": request.headers.get("X-Request-ID", ""),
        }
        if request_data.idempotencyKey:
            headers["Idempotency-Key"] = request_data.idempotencyKey

        if settings.mock_mode:
            result = {"runId": f"mock-{runbook_id}", "accepted": True}
        else:
            result = await runbook_proxy.execute(runbook_id, execution_payload, headers)
        RUNBOOK_EXECUTIONS.labels(runbook_id=runbook_id, status="accepted").inc()
        return RunbookExecuteResponse(runId=result["runId"], accepted=result.get("accepted", True))

    @app.get("/api/stream/ops")
    async def ops_stream(_: dict[str, Any] = Depends(require_auth)) -> StreamingResponse:
        async def event_generator():
            yield "data: {\"type\": \"heartbeat\"}\n\n"
            async with broadcaster.subscribe() as queue:
                while True:
                    event = await queue.get()
                    yield f"data: {event}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    return app


app = create_app()
