import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List

from tools import storage

from .utils import increment, log_event

ROOT = Path(__file__).resolve().parents[1]
COHORTS_DIR = ROOT / "artifacts" / "cohorts"
DATA_DIR = ROOT / "samples" / "data"


def define_cohort(name: str, criteria: Dict[str, str]) -> None:
    path = COHORTS_DIR / f"{name}.json"
    storage.write(str(path), criteria)


def _period(ts: str, window: str) -> str:
    dt = datetime.fromisoformat(ts)
    if window == "M":
        return dt.strftime("%Y-%m")
    if window == "W":
        return f"{dt.isocalendar().year}-W{dt.isocalendar().week:02d}"
    if window == "Q":
        q = (dt.month - 1) // 3 + 1
        return f"{dt.year}-Q{q}"
    raise ValueError("unknown window")


METRIC_FUNCS = {
    "revenue": lambda rows: sum(r["revenue"] for r in rows),
    "gross_margin_pct": lambda rows: round(
        (sum(r["revenue"] - r["cost"] for r in rows) / sum(r["revenue"] for r in rows)) * 100,
        2,
    ),
    "nps": lambda rows: round(sum(r["nps"] for r in rows) / len(rows), 2),
    "return_rate": lambda rows: round(sum(r["return_rate"] for r in rows) / len(rows), 4),
    "uptime": lambda rows: round(sum(r["uptime"] for r in rows) / len(rows), 3),
    "mttr": lambda rows: round(sum(r["mttr"] for r in rows) / len(rows), 2),
}


def cohort_view(table: str, cohort_name: str, metrics: List[str], window: str) -> List[Dict[str, float]]:
    criteria = json.loads(storage.read(str(COHORTS_DIR / f"{cohort_name}.json")))
    rows = json.loads(Path(DATA_DIR / f"{table}.json").read_text())
    filtered = [r for r in rows if all(r.get(k) == v for k, v in criteria.items())]
    buckets: Dict[str, List[Dict]] = defaultdict(list)
    for r in filtered:
        buckets[_period(r["date"], window)].append(r)
    out: List[Dict[str, float]] = []
    for period, bucket in sorted(buckets.items()):
        rec = {"period": period}
        for m in metrics:
            rec[m] = METRIC_FUNCS[m](bucket)
        out.append(rec)
    increment("cohort_run")
    log_event({"type": "cohort_run", "cohort": cohort_name, "table": table})
    return out
