from __future__ import annotations

from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List

import csv
import yaml

from . import utils


@dataclass
class Asset:
    id: str
    type: str
    owner: str
    criticality: str
    tags: List[str]
    config: dict | None = None


ASSET_FILE = utils.ARTIFACT_DIR / "assets.json"


def load_from_dir(directory: Path) -> List[Asset]:
    assets_csv = directory / "assets.csv"
    configs_dir = directory / "configs"
    config_map: dict[str, dict] = {}
    if configs_dir.exists():
        for p in configs_dir.glob("*.yaml"):
            with p.open("r", encoding="utf-8") as f:
                config_map[p.stem] = yaml.safe_load(f) or {}
    assets: List[Asset] = []
    with assets_csv.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tags = [t.strip() for t in row.get("tags", "").split(",") if t.strip()]
            cfg = config_map.get(row["id"])
            assets.append(
                Asset(
                    id=row["id"],
                    type=row["type"],
                    owner=row["owner"],
                    criticality=row["criticality"],
                    tags=tags,
                    config=cfg,
                )
            )
    utils.write_json(ASSET_FILE, [asdict(a) for a in assets])
    utils.record_metric("sec_assets_loaded", len(assets))
    return assets


def list_assets(asset_type: str | None = None, owner: str | None = None) -> List[Asset]:
    data = utils.read_json(ASSET_FILE)
    assets = [Asset(**a) for a in data]
    if asset_type:
        assets = [a for a in assets if a.type == asset_type]
    if owner:
        assets = [a for a in assets if a.owner == owner]
    return assets
