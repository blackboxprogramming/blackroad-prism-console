from __future__ import annotations
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
