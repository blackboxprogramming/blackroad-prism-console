"""Helpers for quickly visualizing diagnostic time series."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import matplotlib.pyplot as plt
import numpy as np


def plot_energy(time: np.ndarray, kinetic: np.ndarray, potential: np.ndarray, *, output: Optional[Path] = None) -> None:
    plt.figure(figsize=(8, 4))
    plt.plot(time, kinetic, label="Kinetic")
    plt.plot(time, potential, label="Potential")
    plt.plot(time, kinetic + potential, label="Total", linestyle="--")
    plt.xlabel("Time [s]")
    plt.ylabel("Energy [J]")
    plt.title("Energy Diagnostics")
    plt.legend()
    plt.tight_layout()
    if output is not None:
        output.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(output)
    else:
        plt.show()
    plt.close()


def plot_mass(time: np.ndarray, mass: np.ndarray, *, output: Optional[Path] = None) -> None:
    plt.figure(figsize=(8, 3))
    plt.plot(time, mass, color="tab:blue")
    plt.xlabel("Time [s]")
    plt.ylabel("Mass [kg]")
    plt.title("Mass Conservation")
    plt.tight_layout()
    if output is not None:
        output.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(output)
    else:
        plt.show()
    plt.close()
