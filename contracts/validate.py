from __future__ import annotations

import csv
import yaml
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

from metrics import emit

SCHEMA_DIR = Path(__file__).resolve().parent / "schemas"


@dataclass
class Violation:
    code: str
    column: str
    row: int


class ContractError(Exception):
    def __init__(self, violations: List[Violation]):
        self.violations = violations
        codes = ",".join(v.code for v in violations)
        super().__init__(codes)


def _coerce(value, typ):
    if typ == "int":
        return int(value)
    if typ == "float":
        return float(value)
    if typ == "str":
        return str(value)
    return value


def validate_rows(table: str, rows: List[Dict]) -> List[Violation]:
    schema_path = SCHEMA_DIR / f"{table}.yaml"
    schema = yaml.safe_load(schema_path.read_text())
    violations: List[Violation] = []
    for i, row in enumerate(rows):
        for col, rules in schema.items():
            if rules.get("required") and col not in row:
                violations.append(Violation("MISSING_REQUIRED", col, i))
                continue
            if col in row:
                val = row[col]
                typ = rules.get("type")
                try:
                    _coerce(val, typ)
                except Exception:
                    violations.append(Violation("TYPE_MISMATCH", col, i))
                    continue
                if "enum" in rules and val not in rules["enum"]:
                    violations.append(Violation("ENUM_INVALID", col, i))
    if violations:
        for _ in violations:
            emit("contract_violation")
        raise ContractError(violations)
    return []


def validate_file(table: str, path: Path) -> None:
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        rows = list(reader)
    validate_rows(table, rows)

