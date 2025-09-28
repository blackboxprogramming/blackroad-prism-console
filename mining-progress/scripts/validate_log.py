#!/usr/bin/env python3
import csv, sys, datetime as dt


def error(msg):
    print(f"[log-validate] {msg}")
    sys.exit(1)


p = sys.argv[1]
with open(p, newline="") as f:
    r = csv.DictReader(f)
    need = [
        "timestamp",
        "block_height",
        "miner",
        "energy_kwh",
        "fees_btc",
        "subsidy_btc",
        "pool",
        "notes",
    ]
    if r.fieldnames != need:
        error(f"CSV headers must be {need}, got {r.fieldnames}")
    prev_h = None
    for i, row in enumerate(r, start=2):
        try:
            dt.datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00"))
        except Exception:
            error(f"Line {i}: bad timestamp {row['timestamp']}")
        for k in ["block_height", "energy_kwh", "fees_btc", "subsidy_btc"]:
            try:
                float(row[k])
            except Exception:
                error(f"Line {i}: {k} must be numeric")
        h = int(float(row["block_height"]))
        if prev_h is not None and h <= prev_h:
            error(f"Line {i}: block_height not increasing ({h} <= {prev_h})")
        prev_h = h
print("[log-validate] OK")
