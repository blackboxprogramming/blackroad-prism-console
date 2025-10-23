"""Utility helpers for the Hopfield transformer experiment."""

from __future__ import annotations

import hashlib
import json
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

import torch
from torch import Tensor
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

CIFAR_MEAN = (0.4914, 0.4822, 0.4465)
CIFAR_STD = (0.2470, 0.2435, 0.2616)


@dataclass
class MemoryDescription:
    """Metadata describing the synthetic key-value memory."""

    keys: List[str]
    key_to_class: List[int]
    train_indices: List[int]
    holdout_indices: List[int]
    memory_init: Tensor


@dataclass
class RareRecallResult:
    """Metrics for the rare fact recall evaluation."""

    accuracy: float
    retrieved: int
    total: int


def set_seed(seed: int) -> None:
    random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def build_transforms() -> Tuple[transforms.Compose, transforms.Compose]:
    train_tfm = transforms.Compose(
        [
            transforms.RandomCrop(32, padding=4),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize(CIFAR_MEAN, CIFAR_STD),
        ]
    )
    test_tfm = transforms.Compose(
        [
            transforms.ToTensor(),
            transforms.Normalize(CIFAR_MEAN, CIFAR_STD),
        ]
    )
    return train_tfm, test_tfm


def build_dataloaders(
    data_dir: Path,
    batch_size: int,
    num_workers: int = 4,
) -> Tuple[DataLoader, DataLoader]:
    train_tfm, test_tfm = build_transforms()
    train_set = datasets.CIFAR10(root=data_dir, train=True, transform=train_tfm, download=True)
    test_set = datasets.CIFAR10(root=data_dir, train=False, transform=test_tfm, download=True)
    train_loader = DataLoader(
        train_set,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
    )
    test_loader = DataLoader(
        test_set,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )
    return train_loader, test_loader


def _hashed_vector(key: str, embed_dim: int, seed: int) -> Tensor:
    digest = hashlib.sha256(f"{seed}:{key}".encode("utf-8")).digest()
    seed_int = int.from_bytes(digest[:8], "little")
    generator = torch.Generator().manual_seed(seed_int)
    return torch.randn(embed_dim, generator=generator)


def generate_textual_keys(num_keys: int, seed: int) -> List[str]:
    random.seed(seed)
    adjectives = [
        "aurora",
        "luminous",
        "crimson",
        "silent",
        "vector",
        "fractal",
        "mythic",
        "stellar",
        "hidden",
        "quantum",
        "silver",
        "sunset",
        "violet",
        "ember",
        "zenith",
        "radial",
        "neural",
        "glacial",
        "spectral",
        "velvet",
    ]
    nouns = [
        "falcon",
        "cascade",
        "harbor",
        "nebula",
        "citadel",
        "voyager",
        "horizon",
        "cipher",
        "rift",
        "atlas",
        "mosaic",
        "satchel",
        "harp",
        "arbor",
        "lattice",
        "vector",
        "archive",
        "aurora",
        "plasma",
        "signal",
    ]
    keys: List[str] = []
    for _ in range(num_keys):
        keys.append(f"{random.choice(adjectives)} {random.choice(nouns)}")
    return keys


def assign_classes_to_keys(keys: Sequence[str], num_classes: int) -> List[int]:
    mapping: List[int] = []
    for idx, _ in enumerate(keys):
        mapping.append(idx % num_classes)
    random.shuffle(mapping)
    return mapping


def build_memory_description(
    mem_size: int,
    embed_dim: int,
    num_classes: int,
    seed: int,
    holdout_fraction: float = 0.2,
    textual_key_count: int = 100,
) -> MemoryDescription:
    num_text_keys = min(textual_key_count, mem_size)
    keys = generate_textual_keys(num_text_keys, seed=seed)
    key_classes = assign_classes_to_keys(keys, num_classes)
    key_to_class = [-1 for _ in range(mem_size)]
    for idx, cls in enumerate(key_classes):
        key_to_class[idx] = cls
    rng = random.Random(seed)
    valid_indices = list(range(num_text_keys))
    rng.shuffle(valid_indices)
    holdout_count = max(1, int(len(valid_indices) * holdout_fraction))
    holdout_indices = sorted(valid_indices[:holdout_count])
    train_indices = sorted(valid_indices[holdout_count:])
    memory_init = torch.zeros(mem_size, embed_dim)
    for idx in range(mem_size):
        if idx < num_text_keys:
            memory_init[idx] = _hashed_vector(keys[idx], embed_dim, seed)
        else:
            fallback_key = f"unused-{idx}"
            memory_init[idx] = _hashed_vector(fallback_key, embed_dim, seed)
    return MemoryDescription(
        keys=keys,
        key_to_class=key_to_class,
        train_indices=train_indices,
        holdout_indices=holdout_indices,
        memory_init=memory_init,
    )


def class_to_memory_indices(description: MemoryDescription) -> Dict[int, List[int]]:
    mapping: Dict[int, List[int]] = {}
    for idx in description.train_indices:
        cls = description.key_to_class[idx]
        if cls < 0:
            continue
        mapping.setdefault(cls, []).append(idx)
    return mapping


def sample_memory_indices(
    labels: Tensor,
    mapping: Dict[int, List[int]],
    generator: Optional[random.Random] = None,
) -> Tensor:
    if generator is None:
        generator = random
    choices: List[int] = []
    for label in labels.tolist():
        candidates = mapping.get(int(label), None)
        if not candidates:
            # Fall back to random available index.
            flat_indices = [idx for values in mapping.values() for idx in values]
            choices.append(generator.choice(flat_indices))
        else:
            choices.append(generator.choice(candidates))
    return torch.tensor(choices, dtype=torch.long, device=labels.device)


def save_metrics(metrics: List[Dict[str, float]], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    metrics_path = output_dir / "metrics.json"
    with metrics_path.open("w", encoding="utf-8") as fp:
        json.dump(metrics, fp, indent=2)


def collect_support_query_pairs(
    dataset: datasets.CIFAR10,
    holdout_indices: Sequence[int],
    key_to_class: Sequence[int],
) -> Dict[int, Tuple[Tensor, Tensor]]:
    """Return support/query tensors per holdout key."""

    class_to_items: Dict[int, List[Tensor]] = {}
    for image, label in dataset:
        tensor = transforms.ToTensor()(image)
        class_to_items.setdefault(label, []).append(tensor)
    result: Dict[int, Tuple[Tensor, Tensor]] = {}
    for key_idx in holdout_indices:
        cls = key_to_class[key_idx]
        items = class_to_items.get(cls, [])
        if len(items) < 2:
            continue
        support, query = items[0], items[1]
        result[key_idx] = (support, query)
    return result


def evaluate_rare_recall(
    model,
    device: torch.device,
    dataset: datasets.CIFAR10,
    holdout_indices: Sequence[int],
    key_to_class: Sequence[int],
    normalize_fn,
) -> RareRecallResult:
    """Compute recall after a one-shot memory write for each rare key."""

    if getattr(model, "disable_hopfield", False):
        total = len(holdout_indices)
        return RareRecallResult(accuracy=0.0, retrieved=0, total=total)

    support_pairs = collect_support_query_pairs(dataset, holdout_indices, key_to_class)
    correct = 0
    total = 0
    was_training = model.training
    model.eval()
    with torch.no_grad():
        for key_idx, (support_img, query_img) in support_pairs.items():
            support = normalize_fn(support_img.clone()).unsqueeze(0).to(device)
            query = normalize_fn(query_img.clone()).unsqueeze(0).to(device)
            support_embed = model.encode(support)
            temp_bank = model.temporary_memory(support_embed[0], key_idx)
            query_embed = model.encode(query)
            readout = model.read_with_external_bank(query_embed, temp_bank)
            prediction = int(readout.attention.argmax(dim=1).item())
            if prediction == key_idx:
                correct += 1
            total += 1
    if was_training:
        model.train()
    accuracy = float(correct / max(total, 1))
    return RareRecallResult(accuracy=accuracy, retrieved=correct, total=total)


def identity_normalizer(tensor: Tensor) -> Tensor:
    return tensor

