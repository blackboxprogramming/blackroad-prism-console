"""Training script for Lucidia's world model and memory."""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable, List

import torch
from torch import Tensor
from torch import nn

try:  # pragma: no cover
    from datasets import load_dataset
except Exception:  # pragma: no cover
    load_dataset = None  # type: ignore

from ..agents.lucidia import LucidiaAgent, LucidiaConfig
from ..models.natural_grad import NaturalGradientConfig, NaturalGradientOptimizer


def iter_text(dataset_name: str, split: str = "train", limit: int = 256) -> Iterable[str]:
    if load_dataset is None:
        for i in range(limit):
            yield f"synthetic fact {i}"
        return
    dataset = load_dataset(dataset_name, split=split)
    for row in dataset.take(limit):
        text = row.get("text") or row.get("content") or row.get("sentence")
        if text:
            yield text


def chunk_texts(texts: Iterable[str], chunk_size: int) -> List[List[str]]:
    chunk: List[str] = []
    batches: List[List[str]] = []
    for text in texts:
        chunk.append(text)
        if len(chunk) == chunk_size:
            batches.append(chunk)
            chunk = []
    if chunk:
        batches.append(chunk)
    return batches


def train(args: argparse.Namespace) -> None:
    config = LucidiaConfig(memory_path=args.memory_path)
    agent = LucidiaAgent(config)
    optimiser: torch.optim.Optimizer
    if args.optimizer == "natural_grad":
        optimiser = NaturalGradientOptimizer(
            agent.world_model.parameters(), NaturalGradientConfig(base_lr=args.lr)
        )
    else:
        optimiser = torch.optim.AdamW(agent.world_model.parameters(), lr=args.lr)

    criterion = nn.MSELoss()

    texts = iter_text(args.dataset, limit=args.limit)
    batches = chunk_texts(texts, chunk_size=4)

    for epoch in range(args.epochs):
        epoch_loss = 0.0
        for batch in batches:
            embeddings = torch.stack([agent.encode(text) for text in batch])
            optimiser.zero_grad()
            reconstruction, next_state, reg = agent.world_model(embeddings.unsqueeze(0))
            target = embeddings.mean(dim=0)
            loss = criterion(reconstruction.squeeze(0), target.unsqueeze(0)) + reg
            loss.backward()
            optimiser.step()
            epoch_loss += loss.item()
            for text in batch:
                agent.write_fact(text[:24], text, {"confidence": "0.9"})
        print(f"Epoch {epoch+1}: loss={epoch_loss/len(batches):.4f}")

    agent.store.save()
    print(f"Memory stored at {Path(args.memory_path).resolve()}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Train Lucidia world model")
    parser.add_argument("--dataset", default="ag_news")
    parser.add_argument("--memory-path", default="./memory/lucidia_store.json")
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--optimizer", choices=["adamw", "natural_grad"], default="natural_grad")
    parser.add_argument("--limit", type=int, default=32)
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    train(args)


if __name__ == "__main__":
    main()
