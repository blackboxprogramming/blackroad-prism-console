"""FastAPI endpoint and helper for registering deployed agents."""

from __future__ import annotations

import json
from collections.abc import MutableMapping
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = ROOT / "registry" / "platform_connections.json"

router = APIRouter()


class PlatformLink(BaseModel):
    """Platform attachment metadata persisted for an agent."""

    name: str
    integration_id: str
    status: str
    scopes: List[str] = Field(default_factory=list)
    credential_source: str = "unknown"
    verified_at: datetime
    details: Optional[str] = None


class AgentRegistrationRequest(BaseModel):
    """Registration payload emitted by the onboarding workflow."""

    name: str
    role: str
    email: Optional[str] = None
    key_id: str
    key_fingerprint: str
    permissions: List[str] = Field(default_factory=list)
    platforms: List[PlatformLink] = Field(default_factory=list)
    credentials: Optional[Mapping[str, Any]] = None


class AgentRegistrationResponse(BaseModel):
    """Response returned when an agent is stored in the registry."""

    status: str
    agent: Dict[str, Any]


def _load_registry() -> Dict[str, Any]:
    if not REGISTRY_PATH.exists():
        return {"agents": []}
    with REGISTRY_PATH.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, MutableMapping):
        raise ValueError("platform registry must be a JSON object")
    registry: Dict[str, Any] = dict(data)
    registry.setdefault("agents", [])
    return registry


def _save_registry(registry: Mapping[str, Any]) -> None:
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with REGISTRY_PATH.open("w", encoding="utf-8") as handle:
        json.dump(registry, handle, indent=2)


def _serialise_agent(agent: AgentRegistrationRequest) -> Dict[str, Any]:
    data = agent.model_dump(mode="json")
    data.setdefault("platforms", [])
    return data


def register_agent(payload: AgentRegistrationRequest | Mapping[str, Any]) -> Dict[str, Any]:
    """Persist an agent registration request to the platform registry."""

    if isinstance(payload, AgentRegistrationRequest):
        agent = payload
    else:
        agent = AgentRegistrationRequest.model_validate(payload)

    registry = _load_registry()
    agents: List[Dict[str, Any]] = list(registry.get("agents", []))

    serialised = _serialise_agent(agent)
    for idx, existing in enumerate(agents):
        if existing.get("name") == agent.name:
            agents[idx] = serialised
            break
    else:
        agents.append(serialised)

    registry["agents"] = agents
    registry["generated_at"] = datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")
    _save_registry(registry)
    return {"status": "registered", "agent": serialised}


@router.post("/auth/register_agent", response_model=AgentRegistrationResponse)
def register_agent_endpoint(request: AgentRegistrationRequest) -> AgentRegistrationResponse:
    """FastAPI endpoint used by automation to register agents."""

    if not request.platforms:
        raise HTTPException(status_code=400, detail={"code": "missing_platforms"})

    response = register_agent(request)
    return AgentRegistrationResponse.model_validate(response)


__all__ = [
    "AgentRegistrationRequest",
    "AgentRegistrationResponse",
    "PlatformLink",
    "register_agent",
    "register_agent_endpoint",
    "router",
]
