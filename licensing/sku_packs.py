from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

import yaml

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "configs" / "licensing" / "skus.yaml"


@dataclass
class SkuPack:
    sku: str
    features: List[str]
    limits: Dict[str, int]
    price_list: Dict[str, float]
    dependencies: List[str]


def load_skus() -> Dict[str, SkuPack]:
    data = yaml.safe_load(CONFIG.read_text()) if CONFIG.exists() else {}
    skus: Dict[str, SkuPack] = {}
    for sku, info in (data or {}).items():
        skus[sku] = SkuPack(
            sku=sku,
            features=info.get("features", []),
            limits=info.get("limits", {}),
            price_list=info.get("price_list", {}),
            dependencies=info.get("dependencies", []),
        )
    return skus


def validate_dependencies(skus: Dict[str, SkuPack]) -> bool:
    for sku, pack in skus.items():
        for dep in pack.dependencies:
            if dep not in skus:
                raise ValueError(f"missing dependency {dep} for {sku}")
    return True


def merged_limits(sku_id: str, skus: Dict[str, SkuPack]) -> Dict[str, int]:
    pack = skus[sku_id]
    limits = dict(pack.limits)
    for dep in pack.dependencies:
        dep_limits = merged_limits(dep, skus)
        for k, v in dep_limits.items():
            limits[k] = max(limits.get(k, 0), v)
    return limits


def save_price_list() -> None:
    skus = load_skus()
    data = {sku: pack.price_list for sku, pack in skus.items()}
    storage.write(str(ROOT / "artifacts" / "licensing" / "price_list.json"), data)
