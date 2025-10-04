"""Simple mass-spring demo with energy logging and adaptive time-stepping.

This file does not aim to be a feature-complete Taichi MPM implementation.
Instead it provides a lightweight numerical example that mirrors the logging
behavior we expect from a future Taichi-based solver so that downstream tools
and plots can be exercised.
"""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Sequence


@dataclass
class TimeStepConfig:
    """Configuration for adaptive time step control."""

    initial: float = 0.01
    min: float = 0.0025
    max: float = 0.02
    shrink_factor: float = 0.6
    grow_factor: float = 1.05


@dataclass
class SimulationConfig:
    """Run-time configuration for the toy mass-spring system."""

    mass: float = 1.0
    stiffness: float = 18.0
    damping: float = 0.5
    max_steps: int = 600
    stretch_threshold: float = 1.35
    velocity_threshold: float = 2.5
    step_config: TimeStepConfig = field(default_factory=TimeStepConfig)
    output_dir: Path = Path("outputs")

    @staticmethod
    def from_mapping(data: dict) -> "SimulationConfig":
        defaults = SimulationConfig()
        step_data = data.get("dt", {})
        step_cfg = TimeStepConfig(
            initial=step_data.get("initial", defaults.step_config.initial),
            min=step_data.get("min", defaults.step_config.min),
            max=step_data.get("max", defaults.step_config.max),
            shrink_factor=step_data.get("shrink_factor", defaults.step_config.shrink_factor),
            grow_factor=step_data.get("grow_factor", defaults.step_config.grow_factor),
        )
        return SimulationConfig(
            mass=data.get("mass", defaults.mass),
            stiffness=data.get("stiffness", defaults.stiffness),
            damping=data.get("damping", defaults.damping),
            max_steps=data.get("max_steps", defaults.max_steps),
            stretch_threshold=data.get("stretch_threshold", defaults.stretch_threshold),
            velocity_threshold=data.get("velocity_threshold", defaults.velocity_threshold),
            step_config=step_cfg,
            output_dir=Path(data.get("output_dir", str(defaults.output_dir))),
        )


class EnergyLogger:
    """CSV writer that records per-step energy metrics."""

    HEADERS: Sequence[str] = (
        "step",
        "time",
        "dt",
        "position",
        "velocity",
        "kinetic",
        "elastic",
        "total",
        "dissipated",
        "move_proxy",
    )

    def __init__(self, output_path: Path) -> None:
        self.output_path = output_path
        self._file = output_path.open("w", newline="")
        self._writer = csv.writer(self._file, lineterminator="\n")
        self._writer.writerow(self.HEADERS)
        self._dissipated = 0.0

    def log(
        self,
        step: int,
        time_value: float,
        dt: float,
        position: float,
        velocity: float,
        kinetic: float,
        elastic: float,
    ) -> None:
        total_energy = kinetic + elastic
        move_proxy = abs(velocity * dt)
        self._writer.writerow(
            (
                step,
                time_value,
                dt,
                position,
                velocity,
                kinetic,
                elastic,
                total_energy,
                self._dissipated,
                move_proxy,
            )
        )

    def add_dissipation(self, value: float) -> None:
        self._dissipated += value

    def close(self) -> None:
        self._file.close()


@dataclass
class SimulationState:
    position: float
    velocity: float
    time: float


def integrate_step(
    step_index: int,
    state: SimulationState,
    dt: float,
    config: SimulationConfig,
    logger: EnergyLogger,
) -> SimulationState:
    """Integrate a single explicit Euler step for the mass-spring system."""

    spring_force = -config.stiffness * state.position
    damping_force = -config.damping * state.velocity
    acceleration = (spring_force + damping_force) / config.mass

    velocity = state.velocity + acceleration * dt
    position = state.position + velocity * dt
    time_value = state.time + dt

    kinetic = 0.5 * config.mass * velocity * velocity
    elastic = 0.5 * config.stiffness * position * position
    dissipated = abs(damping_force * velocity * dt)
    logger.add_dissipation(dissipated)
    logger.log(
        step=step_index,
        time_value=time_value,
        dt=dt,
        position=position,
        velocity=velocity,
        kinetic=kinetic,
        elastic=elastic,
    )

    return SimulationState(position=position, velocity=velocity, time=time_value)


def adaptive_dt(dt: float, state: SimulationState, config: SimulationConfig) -> float:
    """Compute the next dt based on velocity and stretch thresholds."""

    if abs(state.velocity) > config.velocity_threshold:
        return max(config.step_config.min, dt * config.step_config.shrink_factor)
    if abs(state.position) > config.stretch_threshold:
        return max(config.step_config.min, dt * config.step_config.shrink_factor)
    return min(config.step_config.max, dt * config.step_config.grow_factor)


def run_simulation(config: SimulationConfig) -> None:
    output_logs = config.output_dir / "logs"
    output_logs.mkdir(parents=True, exist_ok=True)
    log_path = output_logs / "energy.csv"

    logger = EnergyLogger(log_path)
    try:
        dt = config.step_config.initial
        state = SimulationState(position=1.0, velocity=0.0, time=0.0)
        logger.log(
            step=0,
            time_value=state.time,
            dt=dt,
            position=state.position,
            velocity=state.velocity,
            kinetic=0.0,
            elastic=0.5 * config.stiffness * state.position * state.position,
        )

        for step_index in range(1, config.max_steps + 1):
            state = integrate_step(step_index, state, dt, config, logger)
            dt = adaptive_dt(dt, state, config)
    finally:
        logger.close()

    print(f"Wrote energy log to {log_path}")


def load_config(path: Path | None) -> SimulationConfig:
    if path is None:
        return SimulationConfig()
    with path.open("r", encoding="utf-8") as fp:
        data = json.load(fp)
    return SimulationConfig.from_mapping(data)


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the toy Taichi MPM core demo")
    parser.add_argument(
        "--config",
        type=Path,
        default=None,
        help="Optional JSON configuration file overriding the defaults",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> None:
    args = parse_args(argv)
    config = load_config(args.config)
    run_simulation(config)


if __name__ == "__main__":
    main()
