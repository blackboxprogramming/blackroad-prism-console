"""Weight-only quantization scaffolding for BR-NOVA."""

from __future__ import annotations

import argparse
import json
import logging
import pathlib
from typing import Optional

import torch

from .train import BRNovaModel, ModelConfig

LOGGER = logging.getLogger(__name__)


def quantize_weights(config_path: pathlib.Path, checkpoint_path: pathlib.Path, output_path: pathlib.Path, bits: int = 4) -> None:
    if bits not in (4, 8):
        raise ValueError("Only 4-bit and 8-bit quantization is supported in this scaffold")
    with config_path.open("r", encoding="utf-8") as handle:
        config = json.load(handle)
    model = BRNovaModel(ModelConfig(**config["model"]))
    state = torch.load(checkpoint_path, map_location="cpu")
    model.load_state_dict(state)

    quantized_state = {}
    scale = 2 ** bits - 1
    for name, tensor in model.state_dict().items():
        max_abs = tensor.abs().max().item() or 1.0
        quantized = torch.round((tensor / max_abs) * scale).to(torch.int32)
        quantized_state[name] = {
            "quantized": quantized.tolist(),
            "scale": max_abs,
            "bits": bits,
        }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump({"weights": quantized_state}, handle)
    LOGGER.info("Wrote quantized checkpoint to %s", output_path)


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Quantize BR-NOVA checkpoint weights")
    parser.add_argument("config", type=pathlib.Path)
    parser.add_argument("checkpoint", type=pathlib.Path)
    parser.add_argument("output", type=pathlib.Path)
    parser.add_argument("--bits", type=int, default=4)
    parser.add_argument("--log-level", default="INFO")
    return parser.parse_args(argv)


def main(argv: Optional[list[str]] = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(level=getattr(logging, str(args.log_level).upper()))
    quantize_weights(args.config, args.checkpoint, args.output, bits=args.bits)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
