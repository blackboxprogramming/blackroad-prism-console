"""Ensure environment manifests stay aligned with the schema."""
from __future__ import annotations

import json
from pathlib import Path

import pytest
import yaml
from jsonschema import Draft202012Validator

REPO_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = REPO_ROOT / "schemas" / "environment_manifest.schema.json"
MANIFEST_DIR = REPO_ROOT / "environments"


@pytest.fixture(scope="session")
def environment_schema() -> Draft202012Validator:
    schema = json.loads(SCHEMA_PATH.read_text())
    return Draft202012Validator(schema)


def manifest_paths() -> list[Path]:
    return sorted(MANIFEST_DIR.glob("*.yml"))


@pytest.mark.parametrize("manifest_path", manifest_paths(), ids=lambda p: p.name)
def test_environment_manifests_validate(manifest_path: Path, environment_schema: Draft202012Validator) -> None:
    data = yaml.safe_load(manifest_path.read_text()) or {}
    errors = sorted(environment_schema.iter_errors(data), key=lambda err: err.path)
    assert not errors, "\n".join(
        f"{manifest_path.name}: {list(err.path) or ['<root>']} -> {err.message}" for err in errors
    )
