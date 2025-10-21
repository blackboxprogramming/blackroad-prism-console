from __future__ import annotations

import hashlib
import json
import random
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts" / "experiments"
REGISTRY_PATH = ARTIFACTS / "registry.json"


@dataclass
class Experiment:
    id: str
    name: str
    feature: str
    start: str
    end: str
    unit: str
    variants: List[str]
    split: List[float]
    hypothesis: str = ""
    metrics: List[str] = field(default_factory=list)


def load_registry() -> Dict[str, Experiment]:
    if REGISTRY_PATH.exists():
        data = json.loads(REGISTRY_PATH.read_text())
        return {k: Experiment(**v) for k, v in data.items()}
    return {}


def save_registry(registry: Dict[str, Experiment]) -> None:
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    data = {k: v.__dict__ for k, v in registry.items()}
    REGISTRY_PATH.write_text(json.dumps(data, indent=2))


def register_experiment(exp: Experiment) -> None:
    registry = load_registry()
    registry[exp.id] = exp
    save_registry(registry)


def assign_variant(exp: Experiment, unit_value: str) -> str:
    """Deterministically assign a unit to a variant."""
    seed = int(hashlib.md5(f"{exp.id}:{unit_value}".encode()).hexdigest(), 16)
    rnd = random.Random(seed)
    r = rnd.random()
    cumulative = 0.0
    for variant, weight in zip(exp.variants, exp.split):
        cumulative += weight
        if r < cumulative:
            return variant
    return "holdout"
