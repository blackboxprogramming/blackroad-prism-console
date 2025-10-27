"""Tests for SBOM diff helpers."""

from __future__ import annotations

from agents.codex._32_sentinel.sbom.build_sbom import SBOM, SBOMComponent
from agents.codex._32_sentinel.sbom.diff_sbom import diff_sbom


def test_diff_reports_added_and_changed_components() -> None:
    base = SBOM(artifact="artifact.tar", components=[SBOMComponent(path="bin/app", digest="a", size=10)])
    target = SBOM(
        artifact="artifact.tar",
        components=[
            SBOMComponent(path="bin/app", digest="b", size=11),
            SBOMComponent(path="bin/helper", digest="c", size=9),
        ],
    )
    diff = diff_sbom(base, target)
    assert "bin/helper" in diff["added"]
    assert "bin/app" in diff["changed"]
    assert diff["severity"] == "high"


def test_diff_handles_identical_manifests() -> None:
    base = SBOM(artifact="x", components=[])
    target = SBOM(artifact="x", components=[])
    diff = diff_sbom(base, target)
    assert diff["severity"] == "none"
    assert diff["added"] == {}
