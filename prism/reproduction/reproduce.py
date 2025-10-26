"""CLI entrypoint for consent-aware reproduction."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

OPERATORS_DIR = Path(__file__).resolve().parent / "operators"
if str(OPERATORS_DIR) not in sys.path:
    sys.path.insert(0, str(OPERATORS_DIR))

from crossover_modules import crossover_modules  # noqa: E402  pylint: disable=wrong-import-position


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Consent-based reproduction service")
    parser.add_argument("--consent", type=Path, default=Path("prism/reproduction/consent-schema.json"), help="Path to consent JSON")
    parser.add_argument("--parent-a", required=True, help="Identifier for parent A (e.g. lucidia/scribe@sha)")
    parser.add_argument("--parent-b", required=True, help="Identifier for parent B")
    parser.add_argument("--child", required=True, help="Child agent directory name (e.g. lucidia-hybrid)")
    parser.add_argument("--operator", default="module_crossover", help="Reproduction operator to execute")
    parser.add_argument("--agents-root", type=Path, default=Path("prism/agents"), help="Root directory for agent manifests")
    return parser.parse_args()


def _load_consent(path: Path) -> Dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _canonical_parent_id(identifier: str) -> str:
    return identifier.split("@")[0]


def _agent_dir_name(identifier: str) -> str:
    return _canonical_parent_id(identifier).replace("/", "-")


def _ensure_consent_flags(parent: Dict) -> Dict:
    parent = dict(parent)
    if "consent" not in parent:
        parent["consent"] = bool(parent.get("consent_token"))
    return parent


def _validate_consent(consent: Dict, expected_parents: List[str], operator: str) -> List[str]:
    errors: List[str] = []
    parents = consent.get("parents")
    if not isinstance(parents, list) or not parents:
        errors.append("Consent must include a non-empty parents array")
        return errors

    parents = [_ensure_consent_flags(parent) for parent in parents]
    consent["parents"] = parents

    provided = {
        _canonical_parent_id(parent.get("id", "")): parent
        for parent in parents
        if parent.get("id")
    }
    for expected in expected_parents:
        if expected not in provided:
            errors.append(f"Missing consent for parent '{expected}'")
            continue
        token = provided[expected].get("consent_token")
        if not isinstance(token, str) or not token.strip():
            errors.append(f"Parent '{expected}' is missing a consent_token")
        if not provided[expected].get("consent"):
            errors.append(f"Parent '{expected}' must explicitly consent")

    operators = consent.get("operators")
    if not isinstance(operators, list) or operator not in operators:
        errors.append(f"Operator '{operator}' is not permitted by consent")

    if consent.get("license_ok") is not True:
        errors.append("License check failed; consent requires license_ok=true")

    safety_caps = consent.get("safety_caps")
    if not isinstance(safety_caps, dict):
        errors.append("Consent must define safety_caps")
    else:
        for required_cap in ("network_access", "external_write"):
            if safety_caps.get(required_cap) not in {False}:
                errors.append(f"Safety cap '{required_cap}' must be false during reproduction")

    return errors


def _load_genome_path(root: Path, parent_identifier: str) -> Path:
    agent_dir = root / _agent_dir_name(parent_identifier)
    genome_path = agent_dir / "genome.yaml"
    if not genome_path.exists():
        raise FileNotFoundError(f"Missing genome for parent '{parent_identifier}' at {genome_path}")
    return genome_path


def _write_lineage(child_dir: Path, lineage: Dict) -> None:
    lineage_path = child_dir / "lineage.json"
    with lineage_path.open("w", encoding="utf-8") as handle:
        json.dump(lineage, handle, indent=2)
    print(f"Lineage recorded at {lineage_path}")


def main() -> None:
    args = _parse_args()
    consent = _load_consent(args.consent)

    expected_parents = [
        _canonical_parent_id(args.parent_a),
        _canonical_parent_id(args.parent_b),
    ]
    errors = _validate_consent(consent, expected_parents, args.operator)
    if errors:
        joined = "\n - ".join(errors)
        raise ValueError(f"Consent validation failed:\n - {joined}")

    operators = {"module_crossover": crossover_modules}
    if args.operator not in operators:
        raise ValueError(f"Unsupported operator '{args.operator}'")

    parent_a_path = _load_genome_path(args.agents_root, args.parent_a)
    parent_b_path = _load_genome_path(args.agents_root, args.parent_b)

    child_dir_name = args.child
    output_path = operators[args.operator](parent_a_path, parent_b_path, child_dir_name, args.agents_root)

    lineage = {
        "child": child_dir_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "parents": [
            _ensure_consent_flags(entry)
            for entry in consent["parents"]
            if _canonical_parent_id(entry.get("id", "")) in expected_parents
        ],
        "operators": [args.operator],
        "license_ok": consent.get("license_ok"),
        "safety_caps": consent.get("safety_caps"),
        "outputs": {"genome": str(output_path)},
    }

    child_dir = args.agents_root / child_dir_name
    child_dir.mkdir(parents=True, exist_ok=True)
    _write_lineage(child_dir, lineage)


if __name__ == "__main__":
    main()
