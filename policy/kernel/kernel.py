from __future__ import annotations
from typing import Dict, Any
import yaml
from pathlib import Path


class PolicyKernel:
    """Evaluate events against policy: ALLOW | REVIEW | DENY."""

    def __init__(self, policy_path: str | None = None):
        path = Path(policy_path or Path(__file__).with_name("policies.yaml"))
        data = yaml.safe_load(open(path))
        self.kill_switch = data.get("global", {}).get("kill_switch", False)
        self.policies: Dict[str, Dict[str, Any]] = data.get("policies", {})
        self.usage: Dict[str, int] = {}

    def set_kill_switch(self, on: bool):
        self.kill_switch = on

    def _risk(self, source: str, typ: str, payload: Dict[str, Any]) -> int:
        r = 2
        if source == "salesforce" and typ.endswith("closed_won"):
            amt = ((payload.get("opportunity") or {}).get("amount") or 0)
            if amt >= 250_000:
                r += 3
            if amt >= 1_000_000:
                r += 3
        if source == "github":
            if payload.get("repository", {}).get("default_branch") == "main":
                r += 1
            if payload.get("event") == "push":
                r += 1
        if payload.get("env") == "prod" or payload.get("pii"):
            r += 2
        return min(r, 10)

    def evaluate(self, envelope: Dict[str, Any]) -> Dict[str, Any]:
        if self.kill_switch:
            return {"decision": "DENY", "risk": 10, "reason": "Global kill-switch active"}

        typ = envelope.get("type", "")
        src = envelope.get("source", "")
        policy = self.policies.get(typ, {"mode": "review", "max_risk": 5, "compensations": True})
        risk = self._risk(src, typ, envelope.get("payload", {}))
        self.usage[typ] = self.usage.get(typ, 0) + risk
        mode = policy.get("mode", "review")
        if mode == "deny":
            return {"decision": "DENY", "risk": risk, "reason": "Policy deny"}
        if risk <= policy.get("max_risk", 0) and mode == "auto":
            return {"decision": "ALLOW", "risk": risk, "reason": "Within auto risk budget"}
        if risk > policy.get("max_risk", 0):
            return {"decision": "REVIEW", "risk": risk, "reason": "Risk exceeds budget"}
        return {"decision": "REVIEW", "risk": risk, "reason": "Default review"}
