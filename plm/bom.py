from __future__ import annotations

import csv
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

from tools import storage
from tools import artifacts
from orchestrator import metrics

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "plm"
LAKE_DIR = ART_DIR / "lake"
SCHEMA_DIR = ROOT / "contracts" / "schemas"


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


def _schema(name: str) -> str:
    return str(SCHEMA_DIR / name)


def _rewrite_jsonl(filename: str, rows: Iterable[Dict[str, Any]]) -> None:
    LAKE_DIR.mkdir(parents=True, exist_ok=True)
    path = LAKE_DIR / filename
    if path.exists():
        path.unlink()
    for row in rows:
        storage.write(str(path), row)


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
    payload = sorted([asdict(i) for i in items.values()], key=lambda r: (r["id"], r["rev"]))
    artifacts.validate_and_write(str(ART_DIR / "items.json"), payload, _schema("plm_items.schema.json"))
    _rewrite_jsonl("plm_items.jsonl", payload)
    metrics.inc("plm_items_written", len(payload))
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
    payload = [
        {"item_id": b.item_id, "rev": b.rev, "lines": [asdict(l) for l in b.lines]}
        for b in boms.values()
    ]
    payload.sort(key=lambda r: (r["item_id"], r["rev"]))
    artifacts.validate_and_write(str(ART_DIR / "boms.json"), payload, _schema("plm_boms.schema.json"))
    _rewrite_jsonl("plm_boms.jsonl", payload)

    where_records = []
    seen: set[Tuple[str, str, str]] = set()
    for (parent_id, rev), bom_obj in boms.items():
        for line in bom_obj.lines:
            key = (line.component_id, parent_id, rev)
            if key in seen:
                continue
            seen.add(key)
            where_records.append({
                "component_id": line.component_id,
                "parent_id": parent_id,
                "parent_rev": rev,
            })
    where_records.sort(key=lambda r: (r["component_id"], r["parent_id"], r["parent_rev"]))
    artifacts.validate_and_write(
        str(ART_DIR / "where_used.json"),
        where_records,
        _schema("plm_where_used.schema.json"),
    )
    _rewrite_jsonl("plm_where_used.jsonl", where_records)
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


def cli_bom_where_used(argv):
    import argparse

    p = argparse.ArgumentParser(prog="plm:bom:where-used")
    p.add_argument("--component", required=True)
    a = p.parse_args(argv)
    rows = where_used(a.component)
    for item_id, rev in rows:
        print(f"{item_id}@{rev}")
