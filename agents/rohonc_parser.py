"""Utility helpers for the Rohonc Codex page marker dataset."""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, List


def load_page_marker_features(csv_path: str) -> List[Dict[str, float]]:
    """Load feature rows from a CSV dataset.

    Args:
        csv_path: Path to the dataset CSV file.

    Returns:
        A list of dictionaries where each dictionary contains numeric
        feature values for a page.
    """
    with open(csv_path, newline="") as file:
        reader = csv.DictReader(file)
        return [{key: float(value) for key, value in row.items()} for row in reader]


if __name__ == "__main__":
    dataset_path = Path(__file__).resolve().parent.parent / "Rohonc_Codex_-_Page_Marker_Features.csv"
    records = load_page_marker_features(str(dataset_path))
    print(f"Loaded {len(records)} page marker records.")
