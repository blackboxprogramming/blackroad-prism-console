"""SBOM diff helpers used by Sentinel attestations."""

from __future__ import annotations

from dataclasses import asdict, is_dataclass
from typing import Dict, Iterable, Mapping, Tuple

Component = Mapping[str, object]


def _ensure_dict(sbom: object) -> Dict[str, object]:
    if is_dataclass(sbom):
        return asdict(sbom)
    assert isinstance(sbom, Mapping)
    return dict(sbom)


def _component_map(sbom: Mapping[str, object]) -> Dict[str, Component]:
    components = sbom.get("components", [])
    result: Dict[str, Component] = {}
    for component in components:
        path = component["path"]  # type: ignore[index]
        result[str(path)] = component
    return result


def _severity_from_counts(removed: int, changed: int) -> str:
    score = removed * 2 + changed
    if score == 0:
        return "none"
    if score == 1:
        return "low"
    if score == 2:
        return "medium"
    return "high"


def diff_sbom(base: object, target: object) -> Dict[str, object]:
    """Return a diff summary between ``base`` and ``target`` manifests."""

    base_dict = _ensure_dict(base)
    target_dict = _ensure_dict(target)
    base_components = _component_map(base_dict)
    target_components = _component_map(target_dict)

    added: Dict[str, Component] = {}
    removed: Dict[str, Component] = {}
    changed: Dict[str, Tuple[Component, Component]] = {}

    for path, component in target_components.items():
        if path not in base_components:
            added[path] = component
        else:
            base_component = base_components[path]
            if component.get("digest") != base_component.get("digest"):
                changed[path] = (base_component, component)

    for path, component in base_components.items():
        if path not in target_components:
            removed[path] = component

    severity = _severity_from_counts(len(removed), len(changed))
    summary = {
        "added": added,
        "removed": removed,
        "changed": changed,
        "severity": severity,
    }
    return summary
