"""Stub entry point for running the fluid dynamics benchmark."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Dict

import numpy as np


def simulate_stub() -> Dict[str, np.ndarray]:
    timesteps = np.linspace(0.0, 1.0, num=21)
    heights = np.sin(timesteps * 3.14159) * 0.1 + 0.2
    masses = np.full_like(timesteps, 1.0)
    particle_positions = np.random.rand(timesteps.size, 500, 3)

    return {
        "time": timesteps,
        "height": heights,
        "mass": masses,
        "positions": particle_positions,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the fluid benchmark.")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path(__file__).parent.parent / "artifacts" / "genesis",
        help="Directory containing Genesis exports.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).parent.parent / "artifacts" / "fluid",
        help="Directory to store fluid benchmark outputs.",
    )
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)

    results = simulate_stub()
    for key, value in results.items():
        np.save(args.output / f"{key}.npy", value)

    print(f"Fluid benchmark stub completed. Outputs written to {args.output}")


if __name__ == "__main__":
    main()
