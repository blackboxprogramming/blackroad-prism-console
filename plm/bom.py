from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

from orchestrator import metrics
from tools import artifacts, storage

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "plm"
SCHEMA_DIR = ROOT / "contracts" / "schemas"
ITEM_SCHEMA = SCHEMA_DIR / "plm_items.schema.json"
BOM_SCHEMA = SCHEMA_DIR / "plm_boms.schema.json"
WHERE_USED_SCHEMA = SCHEMA_DIR / "plm_where_used.schema.json"


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


def _artifact_path(name: str) -> Path:
    return ART_DIR / name


def _write_artifact(path: Path, data, schema: Path | None = None) -> None:
    ART_DIR.mkdir(parents=True, exist_ok=True)
    schema_path = str(schema) if schema else None
    artifacts.validate_and_write(str(path), data, schema_path)


def _load_items_artifact() -> None:
    global ITEMS
    if ITEMS:
        return
    data = storage.read(str(_artifact_path("items.json")))
    if not data:
        return
    rows = json.loads(data)
    ITEMS = {}
    for row in rows:
        item = Item(**row)
        ITEMS[(item.id, item.rev)] = item


def _load_boms_artifact() -> None:
    global BOMS
    if BOMS:
        return
    data = storage.read(str(_artifact_path("boms.json")))
    if not data:
        return
    rows = json.loads(data)
    BOMS = {}
    for row in rows:
        lines = [BOMLine(**line) for line in row.get("lines", [])]
        bom_obj = BOM(item_id=row["item_id"], rev=row["rev"], lines=lines)
        BOMS[(bom_obj.item_id, bom_obj.rev)] = bom_obj


def ensure_loaded() -> None:
    """Best-effort load of items and BOMs from existing artifacts."""
    _load_items_artifact()
    _load_boms_artifact()


def _write_where_used() -> None:
    ensure_loaded()
    facts = [
        {
            "component_id": line.component_id,
            "parent_id": bom.item_id,
            "parent_rev": bom.rev,
        }
        for bom in BOMS.values()
        for line in bom.lines
    ]
    _write_artifact(_artifact_path("where_used.json"), facts, WHERE_USED_SCHEMA)
    metrics.inc("plm_where_used_written", len(facts) or 1)


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
    payload = [asdict(i) for i in items.values()]
    _write_artifact(_artifact_path("items.json"), payload, ITEM_SCHEMA)
    metrics.inc("plm_items_written", len(payload) or 1)
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
    payload = [
        {"item_id": b.item_id, "rev": b.rev, "lines": [asdict(l) for l in b.lines]}
        for b in boms.values()
    ]
    _write_artifact(_artifact_path("boms.json"), payload, BOM_SCHEMA)
    metrics.inc("plm_boms_written", len(payload) or 1)
    _write_where_used()
    return boms


def explode(item_id: str, rev: str, level: int = 1) -> List[Tuple[int, str, float]]:
    ensure_loaded()
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
    ensure_loaded()
    used = []
    for (parent_id, rev), bom in BOMS.items():
        for line in bom.lines:
            if line.component_id == component_id:
                used.append((parent_id, rev))
                break
    return used


def iter_items() -> Iterable[Item]:
    ensure_loaded()
    return ITEMS.values()


def get_item(item_id: str, rev: str) -> Item | None:
    ensure_loaded()
    return ITEMS.get((item_id, rev))


def get_bom(item_id: str, rev: str) -> BOM | None:
    ensure_loaded()
    return BOMS.get((item_id, rev))


def cli_bom_where_used(argv):
    import argparse

    p = argparse.ArgumentParser(prog="plm:bom:where-used")
    p.add_argument("--component", required=True)
    a = p.parse_args(argv)
    rows = where_used(a.component)
    for item_id, rev in rows:
        print(f"{item_id}@{rev}")
