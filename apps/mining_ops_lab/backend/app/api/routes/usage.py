"""Usage and billing endpoints."""

from datetime import datetime, timedelta

from fastapi import APIRouter

from ...schemas import PlanLimits, UsageSummary

router = APIRouter()

_FREE_LIMITS = PlanLimits(
    name="free",
    max_scenarios=2,
    max_concurrent_jobs=1,
    daily_job_minutes=60,
    enable_csv_export=False,
    enable_webhook_alerts=False,
)

_PRO_LIMITS = PlanLimits(
    name="pro",
    max_scenarios=20,
    max_concurrent_jobs=4,
    daily_job_minutes=600,
    enable_csv_export=True,
    enable_webhook_alerts=True,
)


@router.get("/current", response_model=UsageSummary)
async def get_current_usage(plan: str = "free") -> UsageSummary:
    """Return mocked usage until the metering service is wired up."""

    today = datetime.utcnow()
    period_start = today - timedelta(days=today.day - 1)
    period_end = period_start + timedelta(days=30)
    limits = _PRO_LIMITS if plan == "pro" else _FREE_LIMITS
    job_minutes = 12 if plan == "free" else 120

    return UsageSummary(
        period_start=period_start,
        period_end=period_end,
        job_minutes_consumed=job_minutes,
        concurrent_jobs_peak=1 if plan == "free" else 3,
        plan=limits,
        overage_minutes=max(0, job_minutes - limits.daily_job_minutes),
    )
