#!/usr/bin/env python3
"""Train a simple BPE tokenizer on Lucidia JSONL data."""

import argparse
import json
import os
from pathlib import Path

from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.normalizers import NFKC, Sequence
from tokenizers.pre_tokenizers import Whitespace
from tokenizers.trainers import BpeTrainer


def iter_text(files):
    for path in files:
        if not Path(path).exists():
            continue
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    yield json.loads(line)["text"]
                except Exception:
                    yield line.strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default="datasets/lucidia")
    parser.add_argument("--vocab-size", type=int, default=32000)
    parser.add_argument("--out", default="models/tokenizer.json")
    args = parser.parse_args()

    files = [os.path.join(args.data_dir, "train.jsonl"), os.path.join(args.data_dir, "val.jsonl")]

    tokenizer = Tokenizer(BPE(unk_token="[UNK]"))
    tokenizer.normalizer = Sequence([NFKC()])
    tokenizer.pre_tokenizer = Whitespace()
    trainer = BpeTrainer(vocab_size=args.vocab_size, special_tokens=["<s>", "</s>", "[PAD]", "[UNK]"])

    tokenizer.train_from_iterator(iter_text(files), trainer=trainer)
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    tokenizer.save(args.out)
    print(f"Saved tokenizer to {args.out}")


if __name__ == "__main__":
    main()
