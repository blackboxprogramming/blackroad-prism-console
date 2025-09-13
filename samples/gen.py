import csv
import json
import random
from pathlib import Path

import settings

BASE_DIR = Path(__file__).resolve().parent
GENERATED_DIR = BASE_DIR / "generated"

RNG = random.Random(settings.RANDOM_SEED)


def _write_dataset(path: Path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    # write csv
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    # write json
    json_path = path.with_suffix(".json")
    with json_path.open("w") as jf:
        json.dump(rows, jf, indent=2)


def generate_finance():
    rows = [
        {"week": i, "cash_in": RNG.randint(1000, 5000), "cash_out": RNG.randint(500, 4000)}
        for i in range(1, 5)
    ]
    _write_dataset(GENERATED_DIR / "finance" / "cash.csv", rows)

    rows = [
        {"invoice": i, "amount": RNG.randint(100, 1000)}
        for i in range(1, 5)
    ]
    _write_dataset(GENERATED_DIR / "finance" / "ap.csv", rows)
    _write_dataset(GENERATED_DIR / "finance" / "ar.csv", rows)

    rows = [
        {"currency": c, "rate": r}
        for c, r in [("USD", 1.0), ("EUR", 0.9), ("JPY", 110)]
    ]
    _write_dataset(GENERATED_DIR / "finance" / "fx_rates.csv", rows)

    rows = [
        {"covenant": "debt_ratio", "threshold": 0.6},
        {"covenant": "liquidity", "threshold": 1.5},
    ]
    _write_dataset(GENERATED_DIR / "finance" / "covenants.csv", rows)

    # pricing/cogs/volume for pipeline
    ids = [f"P{i}" for i in range(1, 5)]
    pricing = [{"id": i, "price": RNG.randint(10, 50)} for i in ids]
    cogs = [{"id": i, "cogs": RNG.randint(5, 30)} for i in ids]
    volume = [{"id": i, "volume": RNG.randint(1, 20)} for i in ids]
    _write_dataset(GENERATED_DIR / "finance" / "pricing.csv", pricing)
    _write_dataset(GENERATED_DIR / "finance" / "cogs.csv", cogs)
    _write_dataset(GENERATED_DIR / "finance" / "volume.csv", volume)


def generate_crm():
    stages = ["prospect", "demo", "commit", "close"]
    rows = [
        {
            "opportunity": f"O{i}",
            "stage": RNG.choice(stages),
            "owner": f"user{i}",
            "amount": RNG.randint(1000, 10000),
            "date": f"2024-01-{10+i:02d}",
        }
        for i in range(1, 5)
    ]
    _write_dataset(GENERATED_DIR / "crm" / "opportunities.csv", rows)


def generate_ops():
    rows = [
        {"id": i, "severity": RNG.choice(["low", "high"]), "date": f"2024-02-{i:02d}"}
        for i in range(1, 5)
    ]
    _write_dataset(GENERATED_DIR / "ops" / "incidents.csv", rows)

    rows = [
        {"id": i, "date": f"2024-02-{i:02d}"}
        for i in range(1, 5)
    ]
    _write_dataset(GENERATED_DIR / "ops" / "changes.csv", rows)


def generate_supply():
    rows = [
        {
            "shipment": i,
            "lane": f"L{i}",
            "cost": RNG.randint(100, 500),
            "lead_time": RNG.randint(1, 10),
        }
        for i in range(1, 5)
    ]
    _write_dataset(GENERATED_DIR / "supply" / "shipments.csv", rows)


def generate_hr():
    rows = [
        {"role": f"R{i}", "plan": RNG.randint(1, 5), "attrition": RNG.random()}
        for i in range(1, 5)
    ]
    _write_dataset(GENERATED_DIR / "hr" / "headcount.csv", rows)


def main(overwrite: bool = False):
    if GENERATED_DIR.exists() and any(GENERATED_DIR.iterdir()) and not overwrite:
        raise SystemExit("generated samples exist; use --overwrite to replace")
    for d in GENERATED_DIR.glob("*"):
        if d.is_dir():
            for p in d.glob("*"):
                p.unlink()
    generate_finance()
    generate_crm()
    generate_ops()
    generate_supply()
    generate_hr()
    return str(GENERATED_DIR)


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--overwrite", action="store_true")
    args = ap.parse_args()
    main(args.overwrite)
