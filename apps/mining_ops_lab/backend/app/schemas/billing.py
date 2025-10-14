"""Billing and usage schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class PlanLimits(BaseModel):
    """Describes quotas associated with a subscription plan."""

    name: str
    max_scenarios: int = Field(..., ge=0)
    max_concurrent_jobs: int = Field(..., ge=0)
    daily_job_minutes: int = Field(..., ge=0)
    enable_csv_export: bool = False
    enable_webhook_alerts: bool = False


class UsageSummary(BaseModel):
    """Aggregated usage for the current billing period."""

    period_start: datetime
    period_end: datetime
    job_minutes_consumed: int = Field(..., ge=0)
    concurrent_jobs_peak: int = Field(..., ge=0)
    plan: PlanLimits
    overage_minutes: int = Field(0, ge=0)
