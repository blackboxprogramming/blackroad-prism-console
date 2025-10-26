"""Utilities for exporting presence bus state to markdown dashboards."""
from __future__ import annotations

import argparse
from pathlib import Path

from .storage import CollabStore


def export_markdown(output: Path) -> Path:
    store = CollabStore()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(store.export_markdown(), encoding="utf-8")
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description="Export collaboration presence snapshot to markdown")
    parser.add_argument("--output", default="COLLABORATION_STATUS.md", type=Path)
    args = parser.parse_args()
    path = export_markdown(args.output)
    print(f"wrote {path}")


if __name__ == "__main__":  # pragma: no cover
    main()
