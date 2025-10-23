"""Interactive CLI for Alice and Lucidia."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict

import torch
import yaml

from ..agents.alice import AliceAgent
from ..agents.lucidia import LucidiaAgent, LucidiaConfig
from ..agents.tools import build_default_tools


def load_config(path: Path) -> Dict[str, object]:
    if not path.exists():
        return {}
    if path.suffix in {".yml", ".yaml"}:
        return yaml.safe_load(path.read_text())
    return json.loads(path.read_text())


def parse_steer(steer: str | None) -> torch.Tensor | None:
    if not steer:
        return None
    parts = steer.split(";")
    vector = torch.zeros(len(parts), dtype=torch.float32)
    for i, part in enumerate(parts):
        if ":" in part:
            _, value = part.split(":", 1)
            vector[i] = float(len(value.strip())) / 10.0
    return vector


def build_agents(config: Dict[str, object]) -> AliceAgent:
    lucidia_cfg_dict = config.get("lucidia", {}) if isinstance(config, dict) else {}
    lucidia_config = LucidiaConfig(**lucidia_cfg_dict)
    lucidia = LucidiaAgent(lucidia_config)
    tools = build_default_tools(lucidia.store)
    return AliceAgent(tools)


def run_cli(args: argparse.Namespace) -> None:
    config = load_config(Path(args.config))
    alice = build_agents(config)
    steer_vector = parse_steer(args.sb_steer)
    if steer_vector is not None:
        alice.set_generation_steer(steer_vector)
        generate_tool = alice.tools["generate"]
        generate_tool.generator.steer(args.alpha)
    print("Alice+Lucidia CLI. Type 'exit' to quit.")
    while True:
        goal = input("> goal: ").strip()
        if goal.lower() in {"exit", "quit"}:
            break
        result = alice.execute(goal)
        print("Plan critique:", result.critique)
        for step, output in result.outputs.items():
            print(f"- {step}: {output}")
    print("Goodbye.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run Alice and Lucidia CLI")
    parser.add_argument("--config", default="configs/default.yaml")
    parser.add_argument("--sb-steer", dest="sb_steer", default=None)
    parser.add_argument("--alpha", type=float, default=0.3)
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    run_cli(args)


if __name__ == "__main__":
    main()
