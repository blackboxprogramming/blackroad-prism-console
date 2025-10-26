"""Consent-aware reproduction CLI for Lucidia agents."""
from __future__ import annotations

import argparse
import importlib
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, Set
import sys

CONSENT_REQUIRED_KEYS = {"parents", "operators", "license_ok", "safety_caps"}
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

AGENTS_ROOT = PROJECT_ROOT / "prism" / "agents"
OPERATORS_PACKAGE = "prism.reproduction.operators"
OPERATOR_ALIASES = {
    "crossover_modules": {"module_crossover"},
}


def load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validate_consent(consent: Dict[str, Any], required_operator: str, parent_ids: Iterable[str]) -> None:
    missing = CONSENT_REQUIRED_KEYS - consent.keys()
    if missing:
        raise ValueError(f"Consent file missing required keys: {', '.join(sorted(missing))}")
    if not consent.get("license_ok"):
        raise ValueError("Consent validation failed: license_ok must be true.")
    operators = set(consent.get("operators", []))
    allowed_names = {required_operator}
    allowed_names.update(OPERATOR_ALIASES.get(required_operator, set()))
    if operators.isdisjoint(allowed_names):
        raise ValueError(f"Consent does not allow operator '{required_operator}'.")

    indexed_parents = _index_parents(consent.get("parents", []))
    for parent in parent_ids:
        if parent not in indexed_parents:
            raise ValueError(f"Consent missing approval for parent '{parent}'.")
        parent_entry = indexed_parents[parent]
        if parent_entry.get("consent") is False:
            raise ValueError(f"Parent '{parent}' explicitly denied consent.")
        if not parent_entry.get("consent", True) and not parent_entry.get("consent_token"):
            raise ValueError(f"Parent '{parent}' must provide consent boolean or token.")

    safety = consent.get("safety_caps", {})
    if safety.get("network_access") not in (False, None):
        raise ValueError("Safety caps must disable network access for new agents.")


def load_operator(name: str):
    try:
        return importlib.import_module(f"{OPERATORS_PACKAGE}.{name}")
    except ModuleNotFoundError as exc:
        raise ValueError(f"Unknown reproduction operator '{name}'.") from exc


def emit_lineage(child: str, parent_ids: Iterable[str], operator: str, consent_path: Path, agents_root: Path = AGENTS_ROOT) -> Path:
    lineage = {
        "child": child,
        "parents": list(parent_ids),
        "operator": operator,
        "consent_artifact": str(consent_path),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    lineage_path = agents_root / child / "lineage.json"
    lineage_path.parent.mkdir(parents=True, exist_ok=True)
    with lineage_path.open("w", encoding="utf-8") as handle:
        json.dump(lineage, handle, indent=2)
    return lineage_path


def _index_parents(entries: Iterable[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    index: Dict[str, Dict[str, Any]] = {}
    for entry in entries:
        aliases = _parent_aliases(entry.get("id"))
        for alias in aliases:
            index[alias] = entry
    return index


def _parent_aliases(identifier: Any) -> Set[str]:
    aliases: Set[str] = set()
    if not isinstance(identifier, str):
        return aliases
    aliases.add(identifier)
    base = identifier.split("@", 1)[0]
    aliases.add(base)
    aliases.add(base.replace("/", "-"))
    if "/" in base:
        aliases.add(base.split("/", 1)[1])
    return aliases


def main() -> None:
    parser = argparse.ArgumentParser(description="Consent-aware reproduction service")
    parser.add_argument("--parent-a", required=True, help="First parent agent name")
    parser.add_argument("--parent-b", required=True, help="Second parent agent name")
    parser.add_argument("--child", required=True, help="Child agent name")
    parser.add_argument("--consent", required=True, type=Path, help="Path to consent JSON file")
    parser.add_argument("--operator", default="crossover_modules", help="Operator module to use")
    parser.add_argument("--agents-root", default=AGENTS_ROOT, type=Path)
    args = parser.parse_args()

    consent_data = load_json(args.consent)
    parent_ids = [args.parent_a, args.parent_b]
    validate_consent(consent_data, args.operator, parent_ids)

    operator_module = load_operator(args.operator)
    if not hasattr(operator_module, "create_child"):
        raise ValueError(f"Operator '{args.operator}' does not expose a create_child function.")

    operator_module.create_child(args.parent_a, args.parent_b, args.child, args.agents_root)
    emit_lineage(args.child, parent_ids, args.operator, args.consent, args.agents_root)


if __name__ == "__main__":
    main()
