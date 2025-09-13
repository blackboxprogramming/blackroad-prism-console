from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List
import yaml

ARTIFACTS_ROOT = Path("artifacts/close")


@dataclass
class ReconResult:
    account: str
    status: str
    delta: float

    def to_dict(self) -> dict:
        return {"account": self.account, "status": self.status, "delta": self.delta}


def _load_fixture(path: Path) -> float:
    with path.open() as f:
        reader = csv.DictReader(f)
        total = 0.0
        for row in reader:
            total += float(row.get("amount", 0))
    return total


def run_recons(period: str, adjusted_tb: Dict[str, float], config_path: str, fixtures_dir: str) -> List[ReconResult]:
    cfg = yaml.safe_load(Path(config_path).read_text())
    results: List[ReconResult] = []
    base = ARTIFACTS_ROOT / period / "recons"
    details_dir = base / "details"
    details_dir.mkdir(parents=True, exist_ok=True)
    for acct, info in cfg.get("accounts", {}).items():
        gl_amt = adjusted_tb.get(acct, 0.0)
        fixture_file = Path(fixtures_dir) / info.get("fixture")
        fixture_amt = _load_fixture(fixture_file)
        delta = gl_amt - fixture_amt
        status = "match" if abs(delta) < 0.01 else "diff"
        results.append(ReconResult(account=acct, status=status, delta=round(delta, 2)))
        (details_dir / f"{acct}.md").write_text(
            f"GL: {gl_amt}\nFixture: {fixture_amt}\nDelta: {delta}\n"
        )
    (base / "index.md").write_text("\n".join(f"{r.account}\t{r.status}" for r in results) + "\n")
    (base / "recons.json").write_text(json.dumps([r.to_dict() for r in results], indent=2))
    return results
