from __future__ import annotations

from enum import Enum
from typing import List

from pydantic import AnyHttpUrl, BaseModel


class DashboardStatus(str, Enum):
    good = "good"
    warning = "warning"
    critical = "critical"


class Metric(BaseModel):
    id: str
    title: str
    value: str
    caption: str
    icon: str
    status: DashboardStatus


class Shortcut(BaseModel):
    id: str
    title: str
    icon: str
    url: AnyHttpUrl


class DashboardPayload(BaseModel):
    summary: str
    metrics: List[Metric]
    shortcuts: List[Shortcut]


__all__ = ["DashboardStatus", "Metric", "Shortcut", "DashboardPayload"]
