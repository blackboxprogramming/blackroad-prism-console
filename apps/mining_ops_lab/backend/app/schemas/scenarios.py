"""Scenario management schemas."""

from datetime import datetime

from pydantic import BaseModel, Field

from .profitability import ScenarioParams


class ScenarioCreate(BaseModel):
    """Payload to create or update a scenario."""

    name: str = Field(..., max_length=255)
    params: ScenarioParams


class ScenarioListItem(BaseModel):
    """Summary projection used on list screens."""

    id: str
    name: str
    created_at: datetime
    updated_at: datetime


class ScenarioDetail(ScenarioListItem):
    """Full scenario payload."""

    params: ScenarioParams
    notes: list[str] = Field(default_factory=list)
