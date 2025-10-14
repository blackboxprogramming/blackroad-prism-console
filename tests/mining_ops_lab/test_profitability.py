"""Unit tests for profitability modelling utilities."""

from apps.mining_ops_lab.backend.app.schemas import MonteCarloRequest, ScenarioParams
from apps.mining_ops_lab.backend.app.services.profitability import (
    estimate_profitability,
    run_monte_carlo,
    summarise_monte_carlo,
)


def _baseline_params() -> ScenarioParams:
    return ScenarioParams(
        algorithm="SHA-256",
        expected_hashrate=100.0,
        power_usage_watts=1200.0,
        coin_price_usd=25000.0,
        network_hashrate=1_000_000.0,
        block_reward=6.25,
        pool_fee_percent=1.5,
        instance_cost_per_hour=1.35,
        expected_uptime=0.95,
    )


def test_estimate_profitability_deterministic() -> None:
    params = _baseline_params()
    estimate = estimate_profitability(params)

    assert estimate.revenue_per_day_usd > 0
    assert estimate.cost_per_day_usd > 0
    assert estimate.revenue_per_day_usd != estimate.cost_per_day_usd


def test_run_monte_carlo_returns_expected_sample_count() -> None:
    request = MonteCarloRequest(scenario=_baseline_params(), samples=50)
    estimates = run_monte_carlo(request)

    assert len(estimates) == 50


def test_summarise_monte_carlo_returns_average_values() -> None:
    request = MonteCarloRequest(scenario=_baseline_params(), samples=25)
    estimates = run_monte_carlo(request)
    revenue, cost = summarise_monte_carlo(estimates)

    assert revenue > 0
    assert cost > 0
