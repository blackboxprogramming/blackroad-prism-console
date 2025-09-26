"""Quantum finance sandbox.

A toy model representing a market price as a probability amplitude across
states.  Evolution is modelled as a simple unitary rotation and observation
collapses the state to a classical price.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict

import numpy as np


@dataclass
class QuantumMarket:
    """Evolve a price distribution like a quantum state."""

    amplitudes: np.ndarray

    def step(self) -> None:
        """Apply a unitary rotation to evolve the amplitudes."""

        theta = np.pi / 8
        rot = np.array([[np.cos(theta), -np.sin(theta)], [np.sin(theta), np.cos(theta)]])
        self.amplitudes = rot @ self.amplitudes

    def observe(self) -> int:
        """Collapse the distribution to a classical outcome index."""

        probs = np.abs(self.amplitudes) ** 2
        choice = int(np.random.choice(len(probs), p=probs))
        collapsed = np.zeros_like(self.amplitudes)
        collapsed[choice] = 1.0
        self.amplitudes = collapsed
        return choice


def demo(steps: int = 5, output_dir: Path | str = Path("output/finance")) -> Dict[str, str]:
    """Simulate ``steps`` of market evolution and log results."""

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    market = QuantumMarket(np.array([1.0, 0.0]))
    history = []
    for _ in range(steps):
        market.step()
        history.append(market.amplitudes.tolist())
    price = market.observe()
    log = {"history": history, "collapsed": price}
    with (out / "quantum_finance.json").open("w", encoding="utf8") as fh:
        json.dump(log, fh, indent=2)
    return {"log": str(out / "quantum_finance.json")}
