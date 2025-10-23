"""Lightweight retriever fine-tuning stub."""
from __future__ import annotations

import argparse

import torch

from ..models.encoders import EncoderConfig, TextEncoder


def train(args: argparse.Namespace) -> None:
    encoder = TextEncoder(EncoderConfig(model_name=args.model_name))
    optimiser = torch.optim.AdamW(encoder.parameters(), lr=args.lr)
    synthetic_pairs = [
        ("renewable energy benefits", "Solar power reduces emissions."),
        ("quantum computing", "Qubits enable parallelism."),
    ]
    for epoch in range(args.epochs):
        loss_val = 0.0
        for query, doc in synthetic_pairs:
            optimiser.zero_grad()
            query_vec = encoder.encode([query])[0]
            doc_vec = encoder.encode([doc])[0]
            loss = 1 - torch.cosine_similarity(query_vec, doc_vec, dim=0)
            loss.backward()
            optimiser.step()
            loss_val += float(loss.item())
        print(f"Epoch {epoch+1}: loss={loss_val/len(synthetic_pairs):.4f}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fine-tune retrieval encoder")
    parser.add_argument("--model-name", default="sentence-transformers/all-MiniLM-L6-v2")
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--lr", type=float, default=5e-5)
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    train(args)


if __name__ == "__main__":
    main()
