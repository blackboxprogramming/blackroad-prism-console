"""Lightweight lint checks for observability assets."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DASHBOARD_DIR = ROOT / "observability" / "mac" / "grafana" / "provisioning" / "dashboards"
PROMETHEUS_MANIFEST = ROOT / "deploy" / "k8s" / "monitoring.yaml"


def _validate_dashboards() -> list[str]:
    errors: list[str] = []
    for path in sorted(DASHBOARD_DIR.glob("*.json")):
        try:
            json.loads(path.read_text())
        except json.JSONDecodeError as exc:  # pragma: no cover - defensive guard
            errors.append(f"{path.relative_to(ROOT)}: invalid JSON ({exc})")
    return errors


def _validate_prometheus_manifest() -> list[str]:
    if not PROMETHEUS_MANIFEST.exists():
        return [f"missing {PROMETHEUS_MANIFEST.relative_to(ROOT)}"]

    content = PROMETHEUS_MANIFEST.read_text()
    errors: list[str] = []
    if "service_dependency_up" not in content:
        errors.append(
            "deploy/k8s/monitoring.yaml: expected service_dependency_up alerts/scrapes"
        )
    return errors


def main() -> None:
    issues = _validate_dashboards() + _validate_prometheus_manifest()
    if issues:
        for issue in issues:
            print(f"observability lint: {issue}", file=sys.stderr)
        raise SystemExit(1)

    print("observability lint: ok")


if __name__ == "__main__":
    main()
