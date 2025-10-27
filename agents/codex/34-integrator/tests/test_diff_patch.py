from __future__ import annotations

from agents.codex._34_integrator.pipelines.diff_patch import apply_patch, compute_diff


def test_compute_diff_detects_changes() -> None:
    current = {"a": 1, "b": 2}
    desired = {"b": 3, "c": 4}

    diff = compute_diff(current, desired)

    assert {entry["op"] for entry in diff} == {"remove", "replace", "add"}

    patched = apply_patch(current, diff)
    assert patched == {"b": 3, "c": 4}
