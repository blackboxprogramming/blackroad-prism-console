"""Simple CLI for risk simulations."""

from __future__ import annotations

import argparse
import random
import statistics
from pathlib import Path
from typing import List

import yaml

REGISTER_FILE = Path(__file__).with_name("register.yaml")


def _load() -> List[dict]:
    with REGISTER_FILE.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def simulate(monte_carlo: int) -> None:
    data = _load()
    results = []
    for _ in range(monte_carlo):
        total = 0.0
        for item in data:
            lik = random.betavariate(
                max(item["likelihood"] * 10, 1), max((1 - item["likelihood"]) * 10, 1)
            )
            imp = random.betavariate(max(item["impact"] * 10, 1), max((1 - item["impact"]) * 10, 1))
            total += lik * imp
        results.append(total)
    mean = statistics.mean(results)
    p95 = statistics.quantiles(results, n=100)[94]
    print(f"mean={mean:.4f} p95={p95:.4f}")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="riskctl")
    sub = parser.add_subparsers(dest="cmd")

    sim = sub.add_parser("simulate", help="run risk Monte Carlo")
    sim.add_argument("--monte-carlo", type=int, default=1000, help="number of simulations")

    args = parser.parse_args(argv)
    if args.cmd == "simulate":
        simulate(args.monte_carlo)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
