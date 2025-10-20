from __future__ import annotations

import csv
import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List
import yaml
from tools import storage, artifacts, metrics

ARTIFACTS_ROOT = Path("artifacts/close")
TB_FIXTURES = Path("fixtures/finance")
JOURNAL_SCHEMA = "contracts/schemas/journals.json"
TB_SCHEMA = "contracts/schemas/trial_balance.json"
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List
import yaml

ARTIFACTS_ROOT = Path("artifacts/close")
FIXTURES_ROOT = Path("fixtures/finance")


@dataclass
class JournalLine:
    account: str
    drcr: str
    amount: float
    amount: float
    drcr: str  # 'dr' or 'cr'

    def signed_amount(self) -> float:
        return self.amount if self.drcr == "dr" else -self.amount


@dataclass
class Journal:
    id: str
    lines: List[JournalLine]


def load_tb(period: str) -> List[dict]:
    path = TB_FIXTURES / f"tb_{period}.csv"
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        return [
            {"account": r["account"], "amount": float(r["amount"]), "drcr": r["drcr"]}
            for r in reader
        ]


def propose_journals(period: str, rules_path: str) -> List[Journal]:
    yaml_data = yaml.safe_load(storage.read(rules_path)) or {}
    journals = []
    for rule in yaml_data.get("journals", []):
        lines = [JournalLine(**ln) for ln in rule["lines"]]
        journals.append(Journal(id=rule["id"], lines=lines))
    path = ARTIFACTS_ROOT / period
    data = [asdict(j) for j in journals]
    artifacts.validate_and_write(str(path / "journals.json"), data, JOURNAL_SCHEMA)
    metrics.emit("journals_proposed", len(journals))
    return journals


def post(period: str, journals: List[Journal]) -> List[dict]:
    tb = load_tb(period)
    for j in journals:
        dr = sum(l.amount for l in j.lines if l.drcr == "dr")
        cr = sum(l.amount for l in j.lines if l.drcr == "cr")
        if round(dr - cr, 2) != 0:
            raise ValueError("JRNL_UNBALANCED")
        for l in j.lines:
            tb.append({"account": l.account, "amount": l.amount, "drcr": l.drcr})
    # aggregate
    agg: dict[tuple[str, str], float] = {}
    for row in tb:
        key = (row["account"], row["drcr"])
        agg[key] = agg.get(key, 0.0) + row["amount"]
    adjusted = [
        {"account": acc, "drcr": drcr, "amount": round(amount, 2)}
        for (acc, drcr), amount in sorted(agg.items())
    ]
    path = ARTIFACTS_ROOT / period
    artifacts.validate_and_write(str(path / "adjusted_tb.json"), adjusted, TB_SCHEMA)
    # also csv
    csv_path = path / "adjusted_tb.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=["account", "drcr", "amount"])
        writer.writeheader()
        writer.writerows(adjusted)
    metrics.emit("journals_posted", len(journals))
    return adjusted


def load_journals(period: str) -> List[Journal]:
    path = ARTIFACTS_ROOT / period / "journals.json"
    data = json.loads(storage.read(str(path))) if path.exists() else []
    return [Journal(id=j["id"], lines=[JournalLine(**l) for l in j["lines"]]) for j in data]
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
