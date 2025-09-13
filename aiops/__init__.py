from pathlib import Path

# Shared paths and in-memory metrics for AIOps modules
ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"

# simple in-memory metrics counter used by modules and tests
METRICS = {
    "aiops_correlations": 0,
    "aiops_plans": 0,
    "aiops_execs": 0,
    "aiops_exec_blocked": 0,
    "aiops_drift_detected": 0,
    "aiops_budget_alerts": 0,
}


def _inc(metric: str, amount: int = 1) -> None:
    """Increment a metric in the in-memory store."""
    METRICS[metric] = METRICS.get(metric, 0) + amount
