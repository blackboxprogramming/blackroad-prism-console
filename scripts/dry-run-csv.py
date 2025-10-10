#!/usr/bin/env python3
"""Preview the first and last rows of a PR automation CSV."""
from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import List, Dict


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Inspect the CSV used to seed automation branches and PRs."
    )
    parser.add_argument(
        "csv_path",
        type=Path,
        help="Path to the CSV file (e.g. prs-200.csv)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=3,
        help="Number of rows to show from the start and end (default: 3)",
    )
    return parser.parse_args()


def load_rows(path: Path) -> List[Dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
    if not rows:
        raise SystemExit(f"{path} contained no data rows")
    return rows


def format_row(row: Dict[str, str]) -> str:
    columns = [
        row.get("id", "<missing id>"),
        row.get("branch", "<missing branch>"),
        row.get("title", "<missing title>"),
    ]
    labels = row.get("labels")
    summary = row.get("summary")
    if labels:
        columns.append(labels)
    if summary:
        columns.append(summary)
    return " | ".join(columns)


def main() -> None:
    args = parse_args()
    rows = load_rows(args.csv_path)
    total = len(rows)

    limit = max(1, min(args.limit, total))

    print(f"📄 {args.csv_path} -> {total} rows")
    print(f"Showing first {limit} row(s):")
    for row in rows[:limit]:
        print(f"  {format_row(row)}")

    print(f"\nShowing last {limit} row(s):")
    for row in rows[-limit:]:
        print(f"  {format_row(row)}")


if __name__ == "__main__":
    main()
