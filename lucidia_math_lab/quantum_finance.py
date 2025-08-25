"""Quantum-style finance sandbox."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List

import matplotlib.pyplot as plt
import numpy as np


@dataclass
class QuantumFinanceSimulator:
    price: float
    volatility: float
    history: List[float] = field(default_factory=list)

    def step(self, samples: int = 1000) -> np.ndarray:
        """Simulate a probabilistic price distribution."""

        distribution = np.random.normal(self.price, self.volatility, samples)
        self.history.append(distribution.mean())
        return distribution

    def observe(self, distribution: np.ndarray) -> float:
        """Collapse the distribution to a single price."""

        self.price = float(np.random.choice(distribution))
        return self.price

    def plot(self, distribution: np.ndarray) -> plt.Figure:
        fig, ax = plt.subplots(2, 1, figsize=(6, 6))
        ax[0].hist(distribution, bins=30)
        ax[0].set_title("Probability distribution")
        ax[1].plot(self.history + [self.price])
        ax[1].set_title("Collapsed price over time")
        return fig
