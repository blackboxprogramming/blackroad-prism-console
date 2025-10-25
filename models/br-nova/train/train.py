"""Main training loop for BR-NOVA models."""

from __future__ import annotations

import argparse
import json
import logging
import math
import pathlib
import random
from dataclasses import dataclass
from typing import Dict, Iterable, Iterator, List, Optional

import torch
import torch.nn as nn
import torch.optim as optim
import yaml

from . import schedule

LOGGER = logging.getLogger(__name__)


@dataclass
class ModelConfig:
    d_model: int
    n_layers: int
    n_heads: int
    n_kv_heads: int
    ffn_mult: float
    vocab_size: int
    max_position_embeddings: int
    rope_theta: int


class RMSNorm(nn.Module):
    def __init__(self, dim: int, eps: float = 1e-6) -> None:
        super().__init__()
        self.weight = nn.Parameter(torch.ones(dim))
        self.eps = eps

    def forward(self, x: torch.Tensor) -> torch.Tensor:  # noqa: D401
        rms = x.pow(2).mean(-1, keepdim=True).add(self.eps).sqrt()
        return self.weight * x / rms


class SwiGLU(nn.Module):
    def __init__(self, dim: int, inner_dim: int) -> None:
        super().__init__()
        self.w1 = nn.Linear(dim, inner_dim, bias=False)
        self.w2 = nn.Linear(dim, inner_dim, bias=False)
        self.w3 = nn.Linear(inner_dim, dim, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.w3(torch.nn.functional.silu(self.w1(x)) * self.w2(x))


class TransformerBlock(nn.Module):
    def __init__(self, config: ModelConfig) -> None:
        super().__init__()
        self.attn_norm = RMSNorm(config.d_model)
        self.ffn_norm = RMSNorm(config.d_model)
        self.attn = nn.MultiheadAttention(
            embed_dim=config.d_model,
            num_heads=config.n_heads,
            batch_first=True,
        )
        inner = int(config.d_model * config.ffn_mult)
        self.mlp = SwiGLU(config.d_model, inner)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        attn_input = self.attn_norm(x)
        attn_output, _ = self.attn(attn_input, attn_input, attn_input)
        x = x + attn_output
        ffn_input = self.ffn_norm(x)
        x = x + self.mlp(ffn_input)
        return x


class BRNovaModel(nn.Module):
    def __init__(self, config: ModelConfig) -> None:
        super().__init__()
        self.embed = nn.Embedding(config.vocab_size, config.d_model)
        self.blocks = nn.ModuleList([TransformerBlock(config) for _ in range(config.n_layers)])
        self.norm = RMSNorm(config.d_model)
        self.head = nn.Linear(config.d_model, config.vocab_size, bias=False)

    def forward(self, tokens: torch.Tensor) -> torch.Tensor:
        hidden = self.embed(tokens)
        for block in self.blocks:
            hidden = block(hidden)
        hidden = self.norm(hidden)
        logits = self.head(hidden)
        return logits


@dataclass
class TrainingConfig:
    micro_batch_size: int
    seq_length: int
    gradient_accumulation_steps: int
    precision: str
    global_batch_tokens: int
    checkpoint_every: int
    eval_every: int
    grad_clip: float = 1.0
    length_milestones: Optional[List[int]] = None


@dataclass
class OptimConfig:
    lr: float
    betas: List[float]
    weight_decay: float
    eps: float


@dataclass
class RunConfig:
    model: ModelConfig
    training: TrainingConfig
    optimizer: OptimConfig
    scheduler: schedule.CosineSchedule
    length_ramp: schedule.LengthRamp


def _load_config(path: pathlib.Path) -> RunConfig:
    with path.open("r", encoding="utf-8") as handle:
        payload = yaml.safe_load(handle)
    model_cfg = ModelConfig(**payload["model"])
    training_cfg = TrainingConfig(**payload["training"])
    optim_cfg = OptimConfig(**payload["optimizer"])
    sched_cfg = schedule.CosineSchedule(**payload["scheduler"])
    length_cfg = schedule.LengthRamp(
        start=training_cfg.seq_length,
        end=training_cfg.seq_length,
        milestones=training_cfg.length_milestones or [],
    )
    return RunConfig(model=model_cfg, training=training_cfg, optimizer=optim_cfg, scheduler=sched_cfg, length_ramp=length_cfg)


def _iterate_batches(packed_path: pathlib.Path) -> Iterator[torch.Tensor]:
    with packed_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            payload = json.loads(line)
            yield torch.tensor(payload["tokens"], dtype=torch.long)


def _setup_optimizer(parameters: Iterable[torch.nn.Parameter], config: OptimConfig) -> optim.Optimizer:
    return optim.AdamW(
        parameters,
        lr=config.lr,
        betas=tuple(config.betas),
        weight_decay=config.weight_decay,
        eps=config.eps,
    )


def train(config_path: pathlib.Path, packed_data: pathlib.Path, device: str = "cpu") -> Dict[str, float]:
    run_config = _load_config(config_path)
    torch.manual_seed(42)
    random.seed(42)

    model = BRNovaModel(run_config.model).to(device)
    optimizer = _setup_optimizer(model.parameters(), run_config.optimizer)
    lr_scheduler = torch.optim.lr_scheduler.LambdaLR(
        optimizer, lr_lambda=lambda step: run_config.scheduler.lr_at(step) / run_config.scheduler.base_lr
    )
    scaler = torch.cuda.amp.GradScaler(enabled=run_config.training.precision == "bf16")

    step = 0
    losses: List[float] = []
    for batch_tokens in _iterate_batches(packed_data):
        batch_tokens = batch_tokens.to(device)
        if batch_tokens.ndim == 1:
            batch_tokens = batch_tokens.unsqueeze(0)
        with torch.cuda.amp.autocast(enabled=run_config.training.precision == "bf16", dtype=torch.bfloat16 if run_config.training.precision == "bf16" else torch.float16):
            logits = model(batch_tokens[:, :-1])
            loss = torch.nn.functional.cross_entropy(
                logits.reshape(-1, logits.size(-1)),
                batch_tokens[:, 1:].reshape(-1),
                ignore_index=0,
            )
        scaler.scale(loss / run_config.training.gradient_accumulation_steps).backward()
        if (step + 1) % run_config.training.gradient_accumulation_steps == 0:
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=run_config.training.grad_clip if hasattr(run_config.training, "grad_clip") else 1.0)
            scaler.step(optimizer)
            scaler.update()
            optimizer.zero_grad(set_to_none=True)
            lr_scheduler.step()
        losses.append(loss.item())
        step += 1
    return {"loss": float(sum(losses) / max(len(losses), 1)), "steps": float(step)}


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a BR-NOVA model")
    parser.add_argument("config", type=pathlib.Path)
    parser.add_argument("data", type=pathlib.Path)
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--log-level", default="INFO")
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(level=getattr(logging, str(args.log_level).upper()))
    metrics = train(args.config, args.data, device=args.device)
    LOGGER.info("Training finished: %s", metrics)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
