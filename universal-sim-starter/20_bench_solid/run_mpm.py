"""Stub entry point for running the solid mechanics benchmark."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Dict

import numpy as np


def simulate_stub(output_dir: Path) -> Dict[str, np.ndarray]:
    timesteps = np.linspace(0.0, 1.0, num=11)
    stress = np.linspace(0.0, 5.0e4, num=11)
    contact_time = timesteps[np.argmax(stress > 1.0e4)]
    nodal_positions = np.random.rand(11, 100, 3)

    return {
        "time": timesteps,
        "stress": stress,
        "contact_time": np.array([contact_time]),
        "x": nodal_positions,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the solid benchmark.")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path(__file__).parent.parent / "artifacts" / "genesis",
        help="Directory containing Genesis exports.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).parent.parent / "artifacts" / "solid",
        help="Directory to store solid benchmark outputs.",
    )
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)

    results = simulate_stub(args.output)

    for key, value in results.items():
        np.save(args.output / f"{key}.npy", value)

    print(f"Solid benchmark stub completed. Outputs written to {args.output}")


if __name__ == "__main__":
    main()
