from __future__ import annotations

"""Offline BOM management with revision tracking and simple CLI.

This module stores Bills of Materials as flat JSON files under
``artifacts/plm/boms``.  Each BOM is versioned using a revision letter and
records effectivity dates and history.  Data files are accompanied by a
SHA256 hash to support tamper evident storage in air‑gapped deployments.
"""

from dataclasses import dataclass, field, asdict
from pathlib import Path
import argparse
import datetime as _dt
import difflib
import hashlib
import json
from typing import Dict, List

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "plm" / "boms"


@dataclass
class BOMLine:
    """Single component line within a BOM."""

    component: str
    qty: float


@dataclass
class BOM:
    """Bill of Materials with minimal revision history."""

    bom_id: str
    rev: str
    effectivity: str
    lines: List[BOMLine] = field(default_factory=list)
    history: List[Dict[str, str]] = field(default_factory=list)

    def to_json(self) -> str:
        return json.dumps(
            {
                "bom_id": self.bom_id,
                "rev": self.rev,
                "effectivity": self.effectivity,
                "lines": [asdict(l) for l in self.lines],
                "history": self.history,
            },
            indent=2,
        )


def _path(bom_id: str, rev: str) -> Path:
    return ART_DIR / f"{bom_id}_{rev}.json"


def _write_with_hash(path: Path, text: str) -> None:
    """Write ``text`` to ``path`` and emit a companion .sha256 file."""

    storage.write(str(path), text)
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    storage.write(str(path.with_suffix(path.suffix + ".sha256")), digest)


def _load(bom_id: str, rev: str) -> BOM:
    data = json.loads(storage.read(str(_path(bom_id, rev))) or "{}")
    if not data:
        raise FileNotFoundError(f"BOM {bom_id}@{rev} not found")
    lines = [BOMLine(**l) for l in data.get("lines", [])]
    return BOM(
        bom_id=data["bom_id"],
        rev=data["rev"],
        effectivity=data.get("effectivity", ""),
        lines=lines,
        history=data.get("history", []),
    )


def _next_rev(rev: str) -> str:
    return chr(ord(rev) + 1)


def new_bom(bom_id: str, effectivity: str, lines: List[BOMLine]) -> BOM:
    bom = BOM(
        bom_id=bom_id,
        rev="A",
        effectivity=effectivity,
        lines=lines,
        history=[{"rev": "A", "ts": _dt.datetime.utcnow().isoformat()}],
    )
    ART_DIR.mkdir(parents=True, exist_ok=True)
    _write_with_hash(_path(bom_id, "A"), bom.to_json())
    return bom


def revise_bom(bom_id: str, from_rev: str, effectivity: str, lines: List[BOMLine]) -> BOM:
    base = _load(bom_id, from_rev)
    new_rev = _next_rev(from_rev)
    bom = BOM(
        bom_id=bom_id,
        rev=new_rev,
        effectivity=effectivity,
        lines=lines,
        history=base.history
        + [{"rev": new_rev, "ts": _dt.datetime.utcnow().isoformat()}],
    )
    ART_DIR.mkdir(parents=True, exist_ok=True)
    _write_with_hash(_path(bom_id, new_rev), bom.to_json())
    return bom


def diff_bom(bom_id: str, rev_a: str, rev_b: str) -> str:
    a = _load(bom_id, rev_a).to_json().splitlines(keepends=True)
    b = _load(bom_id, rev_b).to_json().splitlines(keepends=True)
    diff = difflib.unified_diff(a, b, fromfile=rev_a, tofile=rev_b)
    return "".join(diff)


def _parse_lines(raw: str) -> List[BOMLine]:
    """Parse a simple ``comp:qty,comp:qty`` string."""

    lines: List[BOMLine] = []
    for part in filter(None, [p.strip() for p in raw.split(",")]):
        comp, qty = part.split(":")
        lines.append(BOMLine(component=comp, qty=float(qty)))
    return lines


def cli(argv: List[str]) -> None:
    parser = argparse.ArgumentParser(prog="plmctl bom")
    sub = parser.add_subparsers(dest="cmd")

    p_new = sub.add_parser("new")
    p_new.add_argument("--bom", required=True)
    p_new.add_argument("--effectivity", required=True)
    p_new.add_argument("--lines", required=True, help="comp:qty,comp:qty")

    p_rev = sub.add_parser("revise")
    p_rev.add_argument("--bom", required=True)
    p_rev.add_argument("--from", dest="from_rev", required=True)
    p_rev.add_argument("--effectivity", required=True)
    p_rev.add_argument("--lines", required=True)

    p_diff = sub.add_parser("diff")
    p_diff.add_argument("--bom", required=True)
    p_diff.add_argument("--a", required=True)
    p_diff.add_argument("--b", required=True)

    args = parser.parse_args(argv)

    if args.cmd == "new":
        bom = new_bom(args.bom, args.effectivity, _parse_lines(args.lines))
        print(bom.to_json())
    elif args.cmd == "revise":
        bom = revise_bom(args.bom, args.from_rev, args.effectivity, _parse_lines(args.lines))
        print(bom.to_json())
    elif args.cmd == "diff":
        print(diff_bom(args.bom, args.a, args.b))
    else:
        parser.print_help()


if __name__ == "__main__":
    import sys

    cli(sys.argv[1:])
