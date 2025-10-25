from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, validator


class NodeSpec(BaseModel):
    uses: str
    with_: Dict[str, Any] = Field(default_factory=dict, alias="with")
    if_: Optional[str] = Field(default=None, alias="if")

    class Config:
        allow_population_by_field_name = True


class EdgeSpec(BaseModel):
    from_: str = Field(alias="from")
    to: str

    class Config:
        allow_population_by_field_name = True


class PolicyRetry(BaseModel):
    max: int = 0
    backoff_ms: int = Field(default=0, alias="backoffMs")

    class Config:
        allow_population_by_field_name = True


class PolicyTimeouts(BaseModel):
    node_default_ms: int = Field(default=5000, alias="nodeDefaultMs")

    class Config:
        allow_population_by_field_name = True


class Policies(BaseModel):
    retries: Dict[str, PolicyRetry] = Field(default_factory=dict)
    timeouts: PolicyTimeouts = Field(default_factory=PolicyTimeouts)
    sandbox: Dict[str, Any] = Field(default_factory=dict)


class WorkflowGraph(BaseModel):
    nodes: Dict[str, NodeSpec]
    edges: List[EdgeSpec]

    @validator("nodes")
    def ensure_nodes_not_empty(cls, value: Dict[str, NodeSpec]) -> Dict[str, NodeSpec]:
        if not value:
            raise ValueError("workflow must define at least one node")
        return value


class WorkflowSpec(BaseModel):
    name: str
    version: str
    trigger: Dict[str, Any]
    input_schema: Dict[str, Any] = Field(default_factory=dict, alias="inputSchema")
    graph: WorkflowGraph
    policies: Policies = Field(default_factory=Policies)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        allow_population_by_field_name = True


class RunInput(BaseModel):
    workflow_id: Optional[int] = Field(default=None, alias="workflowId")
    name: Optional[str]
    version: Optional[str]
    input: Dict[str, Any] = Field(default_factory=dict)

    @validator("workflow_id")
    def validate_mutual_exclusion(cls, v: Optional[int], values: Dict[str, Any]) -> Optional[int]:
        name = values.get("name")
        version = values.get("version")
        if v is None and (not name or not version):
            raise ValueError("workflow_id or name+version required")
        return v

    class Config:
        allow_population_by_field_name = True
        allow_population_by_alias = True


__all__ = [
    "NodeSpec",
    "EdgeSpec",
    "Policies",
    "PolicyRetry",
    "PolicyTimeouts",
    "WorkflowGraph",
    "WorkflowSpec",
    "RunInput",
]

