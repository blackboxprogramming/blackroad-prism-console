from __future__ import annotations

import csv
import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Tuple

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "plm"


@dataclass
class Item:
    id: str
    rev: str
    type: str
    uom: str
    lead_time_days: int
    cost: float
    suppliers: List[str]


@dataclass
class BOMLine:
    component_id: str
    qty: float
    refdes: str = ""
    scrap_pct: float = 0.0


@dataclass
class BOM:
    item_id: str
    rev: str
    lines: List[BOMLine]


ITEMS: Dict[Tuple[str, str], Item] = {}
BOMS: Dict[Tuple[str, str], BOM] = {}


def _write_json(path: Path, data) -> None:
    storage.write(str(path), json.dumps(data, indent=2))


def load_items(directory: str) -> Dict[Tuple[str, str], Item]:
    items: Dict[Tuple[str, str], Item] = {}
    for csv_path in Path(directory).glob("*.csv"):
        with open(csv_path, newline="", encoding="utf-8") as fh:
            reader = csv.DictReader(fh)
            for row in reader:
                itm = Item(
                    id=row["id"],
                    rev=row["rev"],
                    type=row["type"],
                    uom=row["uom"],
                    lead_time_days=int(row["lead_time_days"]),
                    cost=float(row["cost"]),
                    suppliers=[s.strip() for s in row.get("suppliers", "").split(";") if s.strip()],
                )
                items[(itm.id, itm.rev)] = itm
    global ITEMS
    ITEMS = items
    ART_DIR.mkdir(parents=True, exist_ok=True)
    _write_json(ART_DIR / "items.json", [asdict(i) for i in items.values()])
    return items


def load_boms(directory: str) -> Dict[Tuple[str, str], BOM]:
    boms: Dict[Tuple[str, str], BOM] = {}
    for csv_path in Path(directory).glob("*.csv"):
        with open(csv_path, newline="", encoding="utf-8") as fh:
            reader = csv.DictReader(fh)
            for row in reader:
                key = (row["item_id"], row["rev"])
                bom = boms.setdefault(key, BOM(item_id=row["item_id"], rev=row["rev"], lines=[]))
                bom.lines.append(
                    BOMLine(
                        component_id=row["component_id"],
                        qty=float(row["qty"]),
                        refdes=row.get("refdes", ""),
                        scrap_pct=float(row.get("scrap_pct", 0) or 0),
                    )
                )
    global BOMS
    BOMS = boms
    ART_DIR.mkdir(parents=True, exist_ok=True)
    _write_json(ART_DIR / "boms.json", [
        {"item_id": b.item_id, "rev": b.rev, "lines": [asdict(l) for l in b.lines]}
        for b in boms.values()
    ])
    return boms


def explode(item_id: str, rev: str, level: int = 1) -> List[Tuple[int, str, float]]:
    result: List[Tuple[int, str, float]] = []

    def _exp(item_id: str, rev: str, lvl: int, qty_scale: float = 1.0):
        if lvl > level:
            return
        bom = BOMS.get((item_id, rev))
        if not bom:
            return
        for line in bom.lines:
            qty = line.qty * qty_scale * (1 + line.scrap_pct / 100.0)
            result.append((lvl, line.component_id, qty))
            _exp(line.component_id, "A", lvl + 1, qty)

    _exp(item_id, rev, 1)
    return result


def where_used(component_id: str) -> List[Tuple[str, str]]:
    used = []
    for (parent_id, rev), bom in BOMS.items():
        for line in bom.lines:
            if line.component_id == component_id:
                used.append((parent_id, rev))
                break
    return used
