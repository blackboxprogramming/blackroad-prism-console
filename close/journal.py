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


@dataclass
class JournalLine:
    account: str
    drcr: str
    amount: float


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
