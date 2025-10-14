"""Job management schemas."""

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class JobState(str, Enum):
    """Canonical job lifecycle states."""

    PENDING = "pending"
    STARTING = "starting"
    RUNNING = "running"
    STOPPING = "stopping"
    STOPPED = "stopped"
    FAILED = "failed"
    CAPPED = "capped"


class JobCreate(BaseModel):
    """Payload for launching a new job."""

    image_uri: str
    cpu: int = Field(..., ge=256, le=16384)
    memory: int = Field(..., ge=512, le=131072)
    gpu: int | None = Field(default=None, ge=0, le=8)
    max_runtime_minutes: int = Field(..., ge=10, le=120)
    budget_cap_usd: float = Field(..., ge=0.5)
    scenario_id: str | None = None
    environment: dict[str, str] = Field(default_factory=dict)
    compliance_provider: Literal["aws"] = "aws"

    @field_validator("image_uri")
    @classmethod
    def _strip_whitespace(cls, value: str) -> str:
        return value.strip()


class JobListItem(BaseModel):
    """Summary details returned in collection endpoints."""

    id: str
    state: JobState
    started_at: datetime | None
    stopped_at: datetime | None
    cost_usd: float | None
    budget_cap_usd: float


class TelemetryPoint(BaseModel):
    """Single telemetry sample for streaming visualisations."""

    ts: datetime
    cpu_pct: float
    mem_pct: float
    gpu_util: float | None = None
    net_tx_bytes: int
    net_rx_bytes: int
    spot_interruption: bool = False


class JobDetail(JobListItem):
    """Detailed payload for job detail view."""

    image_uri: str
    cpu: int
    memory: int
    gpu: int | None = None
    termination_reason: str | None = None
    telemetry: list[TelemetryPoint] = Field(default_factory=list)
