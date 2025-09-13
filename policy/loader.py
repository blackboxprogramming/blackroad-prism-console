from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict

import yaml  # type: ignore[import-untyped]

from orchestrator import metrics

PACKS_DIR = Path(__file__).resolve().parent / 'packs'
APPROVALS_PATH = Path('config/approvals.yaml')
USERS_PATH = Path('config/users.json')
GUARDRAILS_PATH = Path('config/orchestrator_guardrails.json')
MEMORY_LOG = Path('orchestrator/memory.jsonl')


@dataclass
class PolicyPack:
    name: str
    version: str
    rules: Dict[str, Any]


def load_pack(name: str) -> PolicyPack:
    path = PACKS_DIR / f'{name}.yaml'
    data = yaml.safe_load(path.read_text())
    return PolicyPack(name=data.get('name', name), version=str(data.get('version', '1.0')), rules=data.get('rules', {}))


def _merge_dict(base: dict, incoming: dict) -> dict:
    result = base.copy()
    for k, v in incoming.items():
        if isinstance(v, dict) and isinstance(result.get(k), dict):
            result[k] = _merge_dict(result[k], v)
        else:
            result[k] = v
    return result


def apply_pack(pack: PolicyPack) -> None:
    approvals = yaml.safe_load(APPROVALS_PATH.read_text()) if APPROVALS_PATH.exists() else {}
    approvals = _merge_dict(approvals, pack.rules.get('approvals', {}))
    APPROVALS_PATH.write_text(yaml.safe_dump(approvals))

    users = json.loads(USERS_PATH.read_text()) if USERS_PATH.exists() else {'roles': {}}
    users['roles'] = _merge_dict(users.get('roles', {}), pack.rules.get('roles', {}))
    USERS_PATH.write_text(json.dumps(users))

    guardrails = json.loads(GUARDRAILS_PATH.read_text()) if GUARDRAILS_PATH.exists() else {}
    guardrails = _merge_dict(guardrails, pack.rules.get('guardrails', {}))
    GUARDRAILS_PATH.write_text(json.dumps(guardrails))

    record = {'pack': pack.name, 'version': pack.version}
    MEMORY_LOG.write_text(MEMORY_LOG.read_text() + json.dumps(record) + '\n' if MEMORY_LOG.exists() else json.dumps(record) + '\n')
    metrics.inc(metrics.policy_applied)
