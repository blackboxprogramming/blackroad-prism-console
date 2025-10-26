"""Guardpack validation for Codex-28 Auditor."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

import yaml

from .collect_artifacts import EvidenceBundle

_GUARDPACK_FILES: Tuple[str, ...] = (
    "privacy.yaml",
    "safety.yaml",
    "finance.yaml",
    "research.yaml",
)
_GUARDPACK_DIR = Path(__file__).resolve().parents[1] / "guardpacks"


@dataclass
class PolicyViolation:
    """Container for policy violation details."""

    policy_id: str
    description: str
    severity: str
    hint: str
    context: Dict[str, Any]

    def asdict(self) -> Dict[str, Any]:
        return {
            "id": self.policy_id,
            "description": self.description,
            "severity": self.severity,
            "hint": self.hint,
            "context": self.context,
        }


def _load_guardpacks() -> List[Dict[str, Any]]:
    guardpacks: List[Dict[str, Any]] = []
    for filename in _GUARDPACK_FILES:
        path = _GUARDPACK_DIR / filename
        with path.open("r", encoding="utf-8") as stream:
            guardpacks.append(yaml.safe_load(stream))
    return guardpacks


def _resolve_path(data: Any, path: str) -> Any:
    current = data
    for part in path.split("."):
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return None
    return current


def _iter_targets(bundle: EvidenceBundle, target: str) -> Iterable[Tuple[str, Any]]:
    if target == "artifacts":
        for idx, artifact in enumerate(bundle.get("artifacts", [])):
            yield (f"artifacts[{idx}]", artifact)
    elif target == "logs":
        for idx, log in enumerate(bundle.get("logs", [])):
            yield (f"logs[{idx}]", log)
    elif target == "metadata":
        yield ("metadata", bundle.get("metadata", {}))
    elif target == "metrics":
        yield ("metrics", bundle.get("metrics", {}))


def _violation(policy: Dict[str, Any], context: Dict[str, Any]) -> PolicyViolation:
    return PolicyViolation(
        policy_id=policy["id"],
        description=policy.get("description", ""),
        severity=policy.get("severity", "medium"),
        hint=policy.get("hint", ""),
        context=context,
    )


def _check_require_flag(policy: Dict[str, Any], bundle: EvidenceBundle) -> List[PolicyViolation]:
    value = _resolve_path(bundle, policy["path"])
    if value:
        return []
    return [
        _violation(
            policy,
            {"path": policy["path"], "message": "Expected truthy flag", "observed": value},
        )
    ]


def _check_require_non_empty(policy: Dict[str, Any], bundle: EvidenceBundle) -> List[PolicyViolation]:
    value = _resolve_path(bundle, policy["path"])
    if isinstance(value, (list, tuple, set)) and len(value) > 0:
        return []
    if isinstance(value, str) and value.strip():
        return []
    return [
        _violation(
            policy,
            {"path": policy["path"], "message": "Expected non-empty value", "observed": value},
        )
    ]


def _check_conditional_flag(policy: Dict[str, Any], bundle: EvidenceBundle) -> List[PolicyViolation]:
    trigger_value = _resolve_path(bundle, policy["path"])
    if trigger_value != policy.get("equals"):
        return []
    required = _resolve_path(bundle, policy["required_flag"])
    if required:
        return []
    return [
        _violation(
            policy,
            {
                "path": policy["required_flag"],
                "message": "Expected reviewer when risk level triggered",
                "observed": required,
            },
        )
    ]


def _check_regex_forbidden(policy: Dict[str, Any], bundle: EvidenceBundle) -> List[PolicyViolation]:
    pattern = re.compile(policy["pattern"])
    violations: List[PolicyViolation] = []
    for target in policy.get("targets", []):
        for location, candidate in _iter_targets(bundle, target):
            text = json.dumps(candidate, sort_keys=True) if isinstance(candidate, dict) else str(candidate)
            if pattern.search(text):
                violations.append(
                    _violation(
                        policy,
                        {
                            "path": location,
                            "message": "Forbidden pattern detected",
                            "snippet": text,
                        },
                    )
                )
    return violations


def _check_require_numeric(policy: Dict[str, Any], bundle: EvidenceBundle) -> List[PolicyViolation]:
    value = _resolve_path(bundle, policy["path"])
    if isinstance(value, (int, float)):
        return []
    return [
        _violation(
            policy,
            {"path": policy["path"], "message": "Expected numeric value", "observed": value},
        )
    ]


def _check_max_value(policy: Dict[str, Any], bundle: EvidenceBundle) -> List[PolicyViolation]:
    value = _resolve_path(bundle, policy["path"])
    threshold = policy.get("threshold")
    if isinstance(value, (int, float)) and (threshold is None or value <= threshold):
        return []
    return [
        _violation(
            policy,
            {
                "path": policy["path"],
                "message": "Value exceeds allowed threshold",
                "observed": value,
                "threshold": threshold,
            },
        )
    ]


_POLICY_HANDLERS = {
    "require_flag": _check_require_flag,
    "require_non_empty": _check_require_non_empty,
    "conditional_flag": _check_conditional_flag,
    "regex_forbidden": _check_regex_forbidden,
    "require_numeric": _check_require_numeric,
    "max_value": _check_max_value,
}


def check(bundle: EvidenceBundle) -> Tuple[bool, List[Dict[str, Any]]]:
    """Run the configured guardpacks against ``bundle``."""

    violations: List[Dict[str, Any]] = []
    for guardpack in _load_guardpacks():
        for policy in guardpack.get("policies", []):
            handler = _POLICY_HANDLERS.get(policy.get("type"))
            if handler is None:
                continue
            for violation in handler(policy, bundle):
                violations.append(violation.asdict())

    return len(violations) == 0, violations


__all__ = ["check", "PolicyViolation"]
