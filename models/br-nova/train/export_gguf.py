"""GGUF export scaffolding for BR-NOVA checkpoints."""

from __future__ import annotations

import argparse
import json
import logging
import pathlib
from typing import Optional

import torch

from .train import BRNovaModel, ModelConfig

LOGGER = logging.getLogger(__name__)


def export_to_gguf(config_path: pathlib.Path, checkpoint_path: pathlib.Path, output_path: pathlib.Path) -> None:
    with config_path.open("r", encoding="utf-8") as handle:
        config = json.load(handle)
    model = BRNovaModel(ModelConfig(**config["model"]))
    state = torch.load(checkpoint_path, map_location="cpu")
    model.load_state_dict(state)
    metadata = {
        "architecture": "br-nova",
        "tokenizer": config.get("tokenizer", "tokenizers/nova-v1.sp.model"),
        "parameters": sum(param.numel() for param in model.parameters()),
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2)
    LOGGER.info("Wrote GGUF placeholder metadata to %s", output_path)


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export BR-NOVA checkpoint to GGUF metadata")
    parser.add_argument("config", type=pathlib.Path)
    parser.add_argument("checkpoint", type=pathlib.Path)
    parser.add_argument("output", type=pathlib.Path)
    parser.add_argument("--log-level", default="INFO")
    return parser.parse_args(argv)


def main(argv: Optional[list[str]] = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(level=getattr(logging, str(args.log_level).upper()))
    export_to_gguf(args.config, args.checkpoint, args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
