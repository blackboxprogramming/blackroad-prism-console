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
import csv, json, os, argparse
from dataclasses import dataclass, asdict
from typing import List, Dict, Any

ART_DIR = os.path.join('artifacts', 'plm')
ITEMS_PATH = os.path.join(ART_DIR, 'items.json')
BOMS_PATH = os.path.join(ART_DIR, 'boms.json')

os.makedirs(ART_DIR, exist_ok=True)

@dataclass(frozen=True)
class Item:
    id: str
    rev: str
    type: str
    uom: str
    lead_time_days: int
    cost: float
    suppliers: List[str]

@dataclass(frozen=True)
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
    payload = [asdict(i) for i in items.values()]
    _write_artifact(_artifact_path("items.json"), payload, ITEM_SCHEMA)
    metrics.inc("plm_items_written", len(payload) or 1)
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
    payload = [
        {"item_id": b.item_id, "rev": b.rev, "lines": [asdict(l) for l in b.lines]}
        for b in boms.values()
    ]
    _write_artifact(_artifact_path("boms.json"), payload, BOM_SCHEMA)
    metrics.inc("plm_boms_written", len(payload) or 1)
    _write_where_used()
    ART_DIR.mkdir(parents=True, exist_ok=True)
    _write_json(ART_DIR / "boms.json", [
        {"item_id": b.item_id, "rev": b.rev, "lines": [asdict(l) for l in b.lines]}
        for b in boms.values()
    ])
    return boms


def explode(item_id: str, rev: str, level: int = 1) -> List[Tuple[int, str, float]]:
    ensure_loaded()
    result: List[Tuple[int, str, float]] = []

    def _exp(item_id: str, rev: str, lvl: int, qty_scale: float = 1.0):
        if lvl > level:
    lines: List[Dict[str, Any]]

_ITEMS: List[Item] = []
_BOMS: List[BOM] = []


def _load_csv_items(dirpath: str) -> List[Item]:
    items: List[Item] = []
    for name in sorted(os.listdir(dirpath)):
        if not name.endswith('.csv'):
            continue
        with open(os.path.join(dirpath, name), newline='') as f:
            r = csv.DictReader(f)
            for row in r:
                suppliers = [s.strip() for s in row.get('suppliers','').split('|') if s.strip()]
                items.append(Item(
                    id=row['id'].strip(), rev=row['rev'].strip(), type=row['type'].strip(),
                    uom=row['uom'].strip(), lead_time_days=int(row['lead_time_days']),
                    cost=float(row['cost']), suppliers=suppliers))
    items.sort(key=lambda x: (x.id, x.rev))
    return items


def _load_csv_boms(dirpath: str) -> List[BOM]:
    boms: Dict[tuple, List[Dict[str, Any]]] = {}
    for name in sorted(os.listdir(dirpath)):
        if not name.endswith('.csv'):
            continue
        with open(os.path.join(dirpath, name), newline='') as f:
            r = csv.DictReader(f)
            for row in r:
                key = (row['item_id'].strip(), row['rev'].strip())
                boms.setdefault(key, []).append({
                    'component_id': row['component_id'].strip(),
                    'qty': float(row['qty']),
                    'refdes': row.get('refdes','').strip() or None,
                    'scrap_pct': float(row.get('scrap_pct', '0') or 0.0)
                })
    bom_list = [BOM(item_id=k[0], rev=k[1], lines=sorted(v, key=lambda d:(d['component_id'], d.get('refdes') or '')))
                for k,v in sorted(boms.items())]
    return bom_list


def save_catalogs(items: List[Item], boms: List[BOM]):
    with open(ITEMS_PATH, 'w') as f:
        json.dump([asdict(i) for i in items], f, indent=2, sort_keys=True)
    with open(BOMS_PATH, 'w') as f:
        json.dump([asdict(b) for b in boms], f, indent=2, sort_keys=True)


def load_items(dirpath: str):
    global _ITEMS
    _ITEMS = _load_csv_items(dirpath)
    save_catalogs(_ITEMS, _BOMS)


def load_boms(dirpath: str):
    global _BOMS
    _BOMS = _load_csv_boms(dirpath)
    save_catalogs(_ITEMS, _BOMS)


def explode(item_id: str, rev: str, level: int = 99) -> List[Dict[str, Any]]:
    bom_map = {(b.item_id, b.rev): b for b in _BOMS}
    out = []
    def walk(it, rv, qty, lvl):
        if lvl>level:
            return
        b = bom_map.get((it, rv))
        if not b:
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
        for line in b.lines:
            row = {
                'parent_id': it, 'parent_rev': rv,
                'component_id': line['component_id'], 'qty': qty*line['qty'],
                'level': lvl
            }
            out.append(row)
            walk(line['component_id'], _pick_latest_rev(line['component_id']), qty*line['qty'], lvl+1)
    walk(item_id, rev, 1.0, 1)
    out.sort(key=lambda r:(r['level'], r['parent_id'], r['component_id']))
    return out


def where_used(component_id: str) -> List[Dict[str, str]]:
    uses = []
    for b in _BOMS:
        for line in b.lines:
            if line['component_id']==component_id:
                uses.append({'item_id': b.item_id, 'rev': b.rev})
    uses.sort(key=lambda r:(r['item_id'], r['rev']))
    return uses


def _pick_latest_rev(item_id: str) -> str:
    revs = [i.rev for i in _ITEMS if i.id==item_id]
    return sorted(set(revs))[-1] if revs else 'A'

# CLI

def cli_items_load(argv):
    p = argparse.ArgumentParser(prog='plm:items:load')
    p.add_argument('--dir', required=True)
    a = p.parse_args(argv)
    load_items(a.dir)
    print(f"plm_items_written={len(_ITEMS)} -> {ITEMS_PATH}")


def cli_bom_load(argv):
    p = argparse.ArgumentParser(prog='plm:bom:load')
    p.add_argument('--dir', required=True)
    a = p.parse_args(argv)
    load_boms(a.dir)
    print(f"plm_boms_written={len(_BOMS)} -> {BOMS_PATH}")


def cli_bom_explode(argv):
    p = argparse.ArgumentParser(prog='plm:bom:explode')
    p.add_argument('--item', required=True)
    p.add_argument('--rev', required=True)
    p.add_argument('--level', type=int, default=3)
    a = p.parse_args(argv)
    rows = explode(a.item, a.rev, a.level)
    for r in rows:
        print(f"L{r['level']} {r['parent_id']}->{r['component_id']} x{r['qty']:.3f}")

def cli_bom_where_used(argv):
    p = argparse.ArgumentParser(prog='plm:bom:where-used')
    p.add_argument('--component', required=True)
    a = p.parse_args(argv)
    rows = where_used(a.component)
    for r in rows:
        print(f"{r['item_id']}@{r['rev']}")
