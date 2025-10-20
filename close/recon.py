from __future__ import annotations

import csv
import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List
import yaml
from tools import storage, artifacts, metrics

ARTIFACTS_ROOT = Path("artifacts/close")
CONFIG_PATH = Path("configs/close/recons.yaml")
SCHEMA = "contracts/schemas/recons.json"
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
    evidence: List[str]


def _load_config() -> Dict[str, dict]:
    return yaml.safe_load(storage.read(str(CONFIG_PATH))) or {}


def _load_adjusted_tb(period: str) -> Dict[str, float]:
    path = ARTIFACTS_ROOT / period / "adjusted_tb.json"
    data = json.loads(storage.read(str(path)))
    totals: Dict[str, float] = {}
    for row in data:
        amt = row["amount"] if row["drcr"] == "dr" else -row["amount"]
        totals[row["account"]] = totals.get(row["account"], 0.0) + amt
    return totals


def run_recons(period: str, fixtures_dir: str) -> List[ReconResult]:
    cfg = _load_config()
    tb = _load_adjusted_tb(period)
    results: List[ReconResult] = []
    fdir = Path(fixtures_dir)
    for acct, info in cfg.items():
        method = info.get("method")
        fixture = fdir / info.get("fixture")
        with open(fixture, newline="", encoding="utf-8") as fh:
            reader = csv.DictReader(fh)
            ext_total = sum(float(r["amount"]) for r in reader)
        gl_total = tb.get(acct, 0.0)
        delta = round(gl_total - ext_total, 2)
        status = "match" if abs(delta) < 0.01 else "investigate"
        results.append(ReconResult(account=acct, status=status, delta=delta, evidence=[str(fixture)]))
    path = ARTIFACTS_ROOT / period / "recons"
    artifacts.validate_and_write(str(path / "recons.json"), [asdict(r) for r in results], SCHEMA)
    index_lines = [f"{r.account}\t{r.status}\t{r.delta}" for r in results]
    artifacts.validate_and_write(str(path / "index.md"), "\n".join(index_lines))
    for r in results:
        artifacts.validate_and_write(str(path / f"details/{r.account}.md"), f"delta: {r.delta}")
    metrics.emit("recons_run", len(results))

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
