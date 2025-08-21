#!/usr/bin/env python3
"""Download and format datasets for Glow training."""

import argparse
import os
from pathlib import Path

from torchvision import datasets

DATA_ROOT = Path(os.getenv("DATA_DIR", "/opt/blackroad/data/glow_data"))


def prepare_cifar10(out_dir: Path):
    ds = datasets.CIFAR10(root=out_dir / "raw", train=True, download=True)
    for idx, (img, label) in enumerate(ds):
        class_name = ds.classes[label]
        class_dir = out_dir / class_name
        class_dir.mkdir(parents=True, exist_ok=True)
        img.save(class_dir / f"{idx:05d}.png")


def prepare_celeba(out_dir: Path):
    ds = datasets.CelebA(root=out_dir / "raw", split="train", download=True)
    class_dir = out_dir / "celeba"
    class_dir.mkdir(parents=True, exist_ok=True)
    for idx, (img, _) in enumerate(ds):
        img.save(class_dir / f"{idx:06d}.png")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("dataset", choices=["cifar10", "celeba"], help="dataset to fetch")
    parser.add_argument("--out", dest="out", default=str(DATA_ROOT), help="output directory")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.dataset == "cifar10":
        prepare_cifar10(out_dir)
    else:
        prepare_celeba(out_dir)


if __name__ == "__main__":
    main()
