"""Lightweight JSON storage helpers used by CLI modules."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def load_json(path: Path, default: Any) -> Any:
    """Load JSON data from *path* if it exists, otherwise return *default*.

    Parameters
    ----------
    path:
        Location of the JSON file.
    default:
        Value returned when the file does not yet exist.
    """

    if path.exists():
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    return default


def save_json(path: Path, data: Any) -> None:
    """Persist *data* as JSON to *path*.

    The parent directory is created if necessary.  Datetime and date objects
    are serialised using their ISO representation via ``default=str``.
    """

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)

