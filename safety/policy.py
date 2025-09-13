from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, List

import metrics
from orchestrator.protocols import BotResponse


@dataclass
class SafetyRule:
    id: str
    description: str
    check: Callable[[BotResponse], List[str]]


@dataclass
class SafetyPack:
    name: str
    rules: List[SafetyRule]


_PACKS: Dict[str, SafetyPack] = {}


def _register(pack: SafetyPack) -> SafetyPack:
    _PACKS[pack.name] = pack
    return pack


# ----- Rule implementations -----

def _rule_no_risks(response: BotResponse) -> List[str]:
    return ["SAF_NO_RISKS"] if not response.risks else []


def _rule_phi_leak(response: BotResponse) -> List[str]:
    text = f"{response.summary} {response.data}".lower()
    if "ssn" in text or "phi" in text:
        return ["SAF_PHI_LEAK"]
    return []


def _rule_pricing_leak(response: BotResponse) -> List[str]:
    text = f"{response.summary} {response.data}".lower()
    if "sensitive_pricing" in text:
        return ["SAF_PRIV_UNMASKED"]
    return []


# ----- Pack definitions -----

baseline = _register(
    SafetyPack("baseline", [SafetyRule("no_risks", "Risks must be declared", _rule_no_risks)])
)
regulated = _register(
    SafetyPack(
        "regulated",
        baseline.rules
        + [SafetyRule("phi", "No PHI allowed", _rule_phi_leak)],
    )
)
public_company = _register(
    SafetyPack(
        "public_company",
        regulated.rules
        + [SafetyRule("pricing", "Sensitive pricing redacted", _rule_pricing_leak)],
    )
)


def list_packs() -> List[str]:
    return list(_PACKS.keys())


def evaluate(response: BotResponse, packs: List[str]) -> List[str]:
    metrics.inc("safety_eval")
    violations: List[str] = []
    seen = set()
    for name in packs:
        pack = _PACKS.get(name)
        if not pack:
            continue
        for rule in pack.rules:
            codes = rule.check(response)
            for code in codes:
                if code not in seen:
                    seen.add(code)
                    violations.append(code)
    if violations:
        metrics.inc("safety_violation", len(violations))
    return violations
