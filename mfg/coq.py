import os, argparse
ART_DIR = os.path.join('artifacts','mfg','coq')
os.makedirs(ART_DIR, exist_ok=True)

def compute(period: str):
    rows = [
        ('Prevention',1200.0),('Appraisal',800.0),('Internal Failure',450.0),('External Failure',150.0)
    ]
    with open(os.path.join(ART_DIR,'coq.csv'),'w') as f:
        f.write('bucket,amount\n')
        for b,a in rows: f.write(f"{b},{a}\n")
    with open(os.path.join(ART_DIR,'coq.md'),'w') as f:
        total = sum(a for _,a in rows)
        f.write(f"# COQ {period}\n\nTotal={total:.2f}\n")
    print("coq_built=1")

from orchestrator import metrics
from tools import artifacts
from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "coq"
FIXTURES = ROOT / "fixtures" / "mfg"
SCHEMA = ROOT / "contracts" / "schemas" / "mfg_coq.schema.json"


def build(period: str):
    path = FIXTURES / f"coq_{period}.csv"
    totals: Dict[str, float] = {}
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            bucket = row["bucket"]
            totals[bucket] = totals.get(bucket, 0.0) + float(row["cost"])
    ART_DIR.mkdir(parents=True, exist_ok=True)
    report = {"period": period, "buckets": totals}
    artifacts.validate_and_write(str(ART_DIR / "coq.json"), report, str(SCHEMA))
    artifacts.validate_and_write(
        str(ART_DIR / "coq.csv"),
        "bucket,cost\n" + "\n".join(f"{k},{v}" for k, v in totals.items()),
    )
    artifacts.validate_and_write(
        str(ART_DIR / "coq.md"),
        "\n".join(f"{k}: {v}" for k, v in totals.items()),
    )
    metrics.inc("coq_built")
    return report
    storage.write(
        str(ART_DIR / "coq.csv"),
        "bucket,cost\n" + "\n".join(f"{k},{v}" for k, v in totals.items()),
    )
    storage.write(
        str(ART_DIR / "coq.md"),
        "\n".join(f"{k}: {v}" for k, v in totals.items()),
    )
    return totals
# CLI

def cli_coq(argv):
    p = argparse.ArgumentParser(prog='mfg:coq')
    p.add_argument('--period', required=True)
    a = p.parse_args(argv)
    compute(a.period)
