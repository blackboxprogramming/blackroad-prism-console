"""Evaluation harness for BR-NOVA models."""

from __future__ import annotations

import argparse
import json
import logging
import pathlib
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional

import torch

from .train import BRNovaModel, ModelConfig

LOGGER = logging.getLogger(__name__)


@dataclass
class EvalConfig:
    tasks: List[str]
    device: str = "cpu"


def _load_model(config_path: pathlib.Path, checkpoint_path: pathlib.Path, device: str) -> BRNovaModel:
    with config_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    model = BRNovaModel(ModelConfig(**payload["model"]))
    state = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(state)
    model.eval()
    model.to(device)
    return model


def _evaluate_perplexity(model: BRNovaModel, dataset: pathlib.Path, device: str) -> float:
    total_log_prob = 0.0
    total_tokens = 0
    with dataset.open("r", encoding="utf-8") as handle:
        for line in handle:
            payload = json.loads(line)
            tokens = torch.tensor(payload["tokens"], dtype=torch.long, device=device)
            logits = model(tokens[:-1].unsqueeze(0))
            log_probs = torch.nn.functional.log_softmax(logits, dim=-1)
            total_log_prob += torch.nn.functional.nll_loss(
                log_probs.view(-1, log_probs.size(-1)),
                tokens[1:].view(-1),
                reduction="sum",
                ignore_index=0,
            ).item()
            total_tokens += tokens.numel() - 1
    return float(torch.exp(torch.tensor(total_log_prob / max(total_tokens, 1))).item())


def run_evaluations(model: BRNovaModel, tasks: Iterable[str], device: str) -> Dict[str, float]:
    results: Dict[str, float] = {}
    for task in tasks:
        dataset_path = pathlib.Path(task)
        if not dataset_path.exists():
            LOGGER.warning("Skipping missing eval dataset %s", dataset_path)
            continue
        results[f"perplexity::{dataset_path.stem}"] = _evaluate_perplexity(model, dataset_path, device)
    return results


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run BR-NOVA evaluation harness")
    parser.add_argument("config", type=pathlib.Path)
    parser.add_argument("checkpoint", type=pathlib.Path)
    parser.add_argument("tasks", nargs="+", help="Paths to evaluation datasets")
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--log-level", default="INFO")
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(level=getattr(logging, str(args.log_level).upper()))
    model = _load_model(args.config, args.checkpoint, args.device)
    results = run_evaluations(model, args.tasks, args.device)
    LOGGER.info("Eval results: %s", results)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
