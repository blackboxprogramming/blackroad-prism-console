"""Rule specification loader used by the exception service."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Dict, Iterable

import yaml


@dataclass(frozen=True)
class RuleSpec:
    """Metadata surfaced alongside policy violations."""

    rule_id: str
    name: str
    owners: tuple[str, ...]
    docs_url: str | None


def _rules_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "rules"


@lru_cache()
def _load_all() -> Dict[str, RuleSpec]:
    specs: Dict[str, RuleSpec] = {}
    for path in sorted(_rules_dir().glob("*.yaml")):
        payload = yaml.safe_load(path.read_text())
        if not isinstance(payload, dict):
            continue
        rule_id = str(payload.get("id", "")).strip()
        if not rule_id:
            continue
        name = str(payload.get("name") or rule_id)
        owners = tuple(str(owner).strip() for owner in payload.get("owners", []) if str(owner).strip())
        docs_url = payload.get("docs_url")
        if docs_url is not None:
            docs_url = str(docs_url)
        specs[rule_id] = RuleSpec(rule_id, name, owners, docs_url)
    return specs


def all_specs() -> Iterable[RuleSpec]:
    """Return all loaded rule specs."""

    return _load_all().values()


def load_rule(rule_id: str) -> RuleSpec:
    """Lookup ``rule_id`` returning a :class:`RuleSpec`.

    Raises ``KeyError`` if the rule cannot be located.
    """

    specs = _load_all()
    try:
        return specs[rule_id]
    except KeyError as exc:  # pragma: no cover - sanity guard
        raise KeyError(f"unknown rule_id: {rule_id}") from exc
