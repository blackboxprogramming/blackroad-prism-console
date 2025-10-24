"""Generate helper from OpenAPI spec."""
from __future__ import annotations

import json
from pathlib import Path

import yaml

SPEC_PATH = Path(__file__).resolve().parents[2] / "docs" / "api" / "public" / "openapi.yaml"
TARGET = Path(__file__).resolve().parents[1] / "blackroad" / "generated.py"


def main() -> None:
    spec = yaml.safe_load(SPEC_PATH.read_text("utf-8"))
    metadata = {"version": spec["info"].get("version", "0.0.0")}
    TARGET.write_text("# Generated file\nMETADATA = " + json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(f"wrote metadata for version {metadata['version']}")


if __name__ == "__main__":
    main()
