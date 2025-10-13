"""Profitability modelling utilities."""

from __future__ import annotations

import random
from statistics import mean
from typing import Iterable, Tuple

from ..schemas import MonteCarloRequest, ProfitabilityEstimate, ScenarioParams


def estimate_profitability(params: ScenarioParams) -> ProfitabilityEstimate:
    """Return a deterministic profitability estimate for a scenario."""

    revenue_per_day = (
        params.expected_hashrate
        / params.network_hashrate
        * params.block_reward
        * params.coin_price_usd
        * params.expected_uptime
        * (1 - params.pool_fee_percent / 100)
    )
    cost_per_day = params.instance_cost_per_hour * 24 * params.expected_uptime
    if params.power_usage_watts:
        # Assume $0.12/kWh baseline cost.
        cost_per_day += params.power_usage_watts * 24 / 1000 * 0.12

    breakeven_hours = None
    if revenue_per_day > 0:
        hourly_margin = revenue_per_day / 24 - cost_per_day / 24
        if hourly_margin > 0:
            breakeven_hours = params.instance_cost_per_hour / hourly_margin

    notes: list[str] = []
    if revenue_per_day <= cost_per_day:
        notes.append("Scenario is currently unprofitable; consider reducing instance cost or increasing hashrate.")

    return ProfitabilityEstimate(
        revenue_per_day_usd=round(revenue_per_day, 2),
        cost_per_day_usd=round(cost_per_day, 2),
        breakeven_hours=breakeven_hours,
        notes=notes,
    )


def run_monte_carlo(request: MonteCarloRequest) -> list[ProfitabilityEstimate]:
    """Simulate profitability outcomes considering price volatility and spot interruptions."""

    estimates: list[ProfitabilityEstimate] = []

    for _ in range(request.samples):
        price_multiplier = random.gauss(mu=1.0, sigma=request.price_sigma)
        interrupted = random.random() < request.spot_interrupt_probability
        uptime = request.scenario.expected_uptime * (0.5 if interrupted else 1.0)
        perturbed = request.scenario.model_copy(update={"coin_price_usd": request.scenario.coin_price_usd * price_multiplier, "expected_uptime": uptime})
        estimate = estimate_profitability(perturbed)
        estimates.append(estimate)

    return estimates


def summarise_monte_carlo(estimates: Iterable[ProfitabilityEstimate]) -> Tuple[float, float]:
    """Return mean revenue and cost across a set of Monte Carlo runs."""

    revenues = [estimate.revenue_per_day_usd for estimate in estimates]
    costs = [estimate.cost_per_day_usd for estimate in estimates]
    return round(mean(revenues), 2), round(mean(costs), 2)
