"""Product lifecycle management – bill of materials helpers.

The original file accidentally contained two divergent implementations
interleaved together.  This rewrite provides a compact, well-typed
surface that the unit tests rely on.
"""

from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

ART_DIR: Path = Path("artifacts/plm")


@dataclass(frozen=True)
class Item:
    id: str
    rev: str
    type: str
    uom: str
    lead_time_days: int
    cost: float
    suppliers: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class BOMLine:
    component_id: str
    qty: float
    refdes: str | None = None
    scrap_pct: float = 0.0


@dataclass(frozen=True)
class BOM:
    item_id: str
    rev: str
    lines: List[BOMLine]


_ITEMS: List[Item] = []
_BOMS: List[BOM] = []


def _ensure_art_dir() -> Path:
    path = Path(ART_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _items_path() -> Path:
    return _ensure_art_dir() / "items.json"


def _boms_path() -> Path:
    return _ensure_art_dir() / "boms.json"


def _serialize_and_write(path: Path, rows: Iterable[dict]) -> None:
    path.write_text(json.dumps(list(rows), indent=2, sort_keys=True), encoding="utf-8")


def load_items(directory: str) -> List[Item]:
    items: List[Item] = []
    for csv_path in sorted(Path(directory).glob("*.csv")):
        with csv_path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                suppliers = [s.strip() for s in (row.get("suppliers") or "").split("|") if s.strip()]
                item = Item(
                    id=row["id"].strip(),
                    rev=row["rev"].strip(),
                    type=row.get("type", "").strip(),
                    uom=row.get("uom", "").strip(),
                    lead_time_days=int(float(row.get("lead_time_days", 0) or 0)),
                    cost=float(row.get("cost", 0) or 0.0),
                    suppliers=suppliers,
                )
                items.append(item)
    items.sort(key=lambda itm: (itm.id, itm.rev))

    global _ITEMS
    _ITEMS = items
    _serialize_and_write(_items_path(), (asdict(item) for item in _ITEMS))
    return items


def load_boms(directory: str) -> List[BOM]:
    grouped: Dict[Tuple[str, str], List[BOMLine]] = {}
    for csv_path in sorted(Path(directory).glob("*.csv")):
        with csv_path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                key = (row["item_id"].strip(), row["rev"].strip())
                grouped.setdefault(key, []).append(
                    BOMLine(
                        component_id=row["component_id"].strip(),
                        qty=float(row.get("qty", 0) or 0.0),
                        refdes=row.get("refdes", "").strip() or None,
                        scrap_pct=float(row.get("scrap_pct", 0) or 0.0),
                    )
                )
    boms = [BOM(item_id=key[0], rev=key[1], lines=sorted(lines, key=lambda line: (line.component_id, line.refdes or ""))) for key, lines in sorted(grouped.items())]

    global _BOMS
    _BOMS = boms
    _serialize_and_write(
        _boms_path(),
        (
            {"item_id": bom.item_id, "rev": bom.rev, "lines": [asdict(line) for line in bom.lines]}
            for bom in _BOMS
        ),
    )
    return boms


def _bom_lookup() -> Dict[Tuple[str, str], BOM]:
    return {(bom.item_id, bom.rev): bom for bom in _BOMS}


def _pick_latest_rev(item_id: str) -> str:
    revs = sorted({item.rev for item in _ITEMS if item.id == item_id})
    return revs[-1] if revs else "A"


def explode(item_id: str, rev: str, level: int = 1) -> List[Dict[str, float]]:
    lookup = _bom_lookup()
    results: List[Dict[str, float]] = []

    def walk(parent_id: str, current_rev: str, depth: int, qty_scale: float) -> None:
        if depth > level:
            return
        bom = lookup.get((parent_id, current_rev))
        if not bom:
            return
        for line in bom.lines:
            if isinstance(line, dict):
                component_id = line.get("component_id", "")
                qty = float(line.get("qty", 0) or 0.0)
                scrap_pct = float(line.get("scrap_pct", 0) or 0.0)
            else:
                component_id = line.component_id
                qty = line.qty
                scrap_pct = line.scrap_pct
            total_qty = qty_scale * qty * (1 + scrap_pct / 100.0)
            results.append(
                {
                    "level": depth,
                    "parent_id": parent_id,
                    "parent_rev": current_rev,
                    "component_id": component_id,
                    "qty": total_qty,
                }
            )
            if depth < level:
                walk(component_id, _pick_latest_rev(component_id), depth + 1, total_qty)

    walk(item_id, rev, 1, 1.0)
    return results


def where_used(component_id: str) -> List[Dict[str, str]]:
    rows = []
    for bom in _BOMS:
        for line in bom.lines:
            comp_id = line.get("component_id") if isinstance(line, dict) else line.component_id
            if comp_id == component_id:
                rows.append({"item_id": bom.item_id, "rev": bom.rev})
                break
    rows.sort(key=lambda row: (row["item_id"], row["rev"]))
    return rows


def iter_items() -> Iterable[Item]:
    return iter(_ITEMS)


def get_item(item_id: str, rev: str) -> Item | None:
    for item in _ITEMS:
        if item.id == item_id and item.rev == rev:
            return item
    return None


def get_bom(item_id: str, rev: str) -> BOM | None:
    return _bom_lookup().get((item_id, rev))


__all__ = [
    "Item",
    "BOMLine",
    "BOM",
    "load_items",
    "load_boms",
    "explode",
    "where_used",
    "iter_items",
    "get_item",
    "get_bom",
    "_ITEMS",
    "_BOMS",
    "ART_DIR",
]
