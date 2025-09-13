from __future__ import annotations

import csv
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List
import yaml

ARTIFACTS_ROOT = Path("artifacts/close")
FIXTURES_ROOT = Path("fixtures/finance")


@dataclass
class JournalLine:
    account: str
    amount: float
    drcr: str  # 'dr' or 'cr'

    def signed_amount(self) -> float:
        return self.amount if self.drcr == "dr" else -self.amount


@dataclass
class Journal:
    id: str
    lines: List[JournalLine] = field(default_factory=list)

    def is_balanced(self) -> bool:
        total = sum(line.signed_amount() for line in self.lines)
        return abs(total) < 0.0001

    def to_dict(self) -> dict:
        return {"id": self.id, "lines": [line.__dict__ for line in self.lines]}


def load_tb(period: str) -> Dict[str, float]:
    path = FIXTURES_ROOT / f"tb_{period}.csv"
    tb: Dict[str, float] = {}
    with path.open() as f:
        reader = csv.DictReader(f)
        for row in reader:
            amt = float(row["amount"])
            if row["drcr"].lower() == "cr":
                amt = -amt
            tb[row["account"]] = tb.get(row["account"], 0.0) + amt
    return tb


def propose_journals(tb: Dict[str, float], rules_path: str) -> List[Journal]:
    data = yaml.safe_load(Path(rules_path).read_text()) or {}
    journals = []
    for idx, j in enumerate(data.get("journals", []), start=1):
        lines = [JournalLine(**ln) for ln in j.get("lines", [])]
        journals.append(Journal(id=j.get("id", f"J{idx:03d}"), lines=lines))
    return journals


def post(period: str, tb: Dict[str, float], journals: List[Journal]) -> Dict[str, float]:
    for j in journals:
        if not j.is_balanced():
            raise ValueError("JRNL_UNBALANCED")
        for line in j.lines:
            tb[line.account] = tb.get(line.account, 0.0) + line.signed_amount()
    base = ARTIFACTS_ROOT / period
    base.mkdir(parents=True, exist_ok=True)
    (base / "journals.json").write_text(json.dumps([j.to_dict() for j in journals], indent=2))
    # write adjusted tb
    csv_path = base / "adjusted_tb.csv"
    with csv_path.open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["account", "amount"])
        for acct in sorted(tb):
            writer.writerow([acct, f"{tb[acct]:.2f}"])
    return tb
