"""Profitability modeling schemas."""

from typing import List

from pydantic import BaseModel, Field


class ScenarioParams(BaseModel):
    """Parameters for profitability calculations."""

    algorithm: str
    expected_hashrate: float = Field(..., gt=0, description="Hashrate in MH/s or similar unit.")
    power_usage_watts: float | None = Field(
        default=None, gt=0, description="Optional power consumption estimate in watts."
    )
    coin_price_usd: float = Field(..., gt=0)
    network_hashrate: float = Field(..., gt=0)
    block_reward: float = Field(..., gt=0)
    pool_fee_percent: float = Field(..., ge=0, le=100)
    instance_cost_per_hour: float = Field(..., ge=0)
    expected_uptime: float = Field(..., ge=0, le=1)


class ProfitabilityEstimate(BaseModel):
    """Structured response for profitability modelling."""

    revenue_per_day_usd: float
    cost_per_day_usd: float
    breakeven_hours: float | None
    notes: List[str] = Field(default_factory=list)


class MonteCarloRequest(BaseModel):
    """Input payload for Monte Carlo simulations."""

    scenario: ScenarioParams
    price_sigma: float = Field(0.05, ge=0, le=1, description="Relative std-dev for coin price.")
    spot_interrupt_probability: float = Field(
        0.2, ge=0, le=1, description="Probability of a spot interruption during the run."
    )
    samples: int = Field(500, ge=10, le=5000)
