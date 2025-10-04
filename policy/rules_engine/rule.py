from __future__ import annotations

import hashlib
import json
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Mapping, Optional, Tuple

from .context import EvaluationContext
from .evaluator import ExpressionEvaluator


class RuleMode(str, Enum):
    OBSERVE = "observe"
    ENFORCE = "enforce"


@dataclass
class RuleEvaluationResult:
    triggered: bool
    details: Dict[str, Any]
    error: Optional[Exception] = None


@dataclass
class Rule:
    """A declarative policy rule backed by CEL-like expressions."""

    rule_id: str
    expr: str
    mode: RuleMode = RuleMode.OBSERVE
    severity: str = "low"
    block_on_error: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self._evaluator = ExpressionEvaluator(self.expr)

    @property
    def id(self) -> str:
        return self.rule_id

    @classmethod
    def from_dict(cls, payload: Mapping[str, Any]) -> "Rule":
        rule_id = payload.get("id") or payload.get("rule_id")
        if not rule_id:
            raise KeyError("rule id is required")
        expr = payload["expr"]
        mode_value = payload.get("mode") or payload.get("category") or RuleMode.OBSERVE.value
        mode = RuleMode(mode_value)
        severity = payload.get("severity", "low")
        block_on_error = bool(payload.get("block_on_error", False))
        metadata = dict(payload.get("metadata", {}))
        passthrough_keys = (
            "name",
            "description",
            "inputs_schema",
            "output_type",
            "metrics_selector",
            "on_match",
            "notify",
            "owners",
            "docs_url",
            "docs_chart",
            "comments",
            "category",
        )
        for key in passthrough_keys:
            if key in payload and key not in metadata:
                metadata[key] = payload[key]
        return cls(rule_id, expr, mode=mode, severity=severity, block_on_error=block_on_error, metadata=metadata)

    def evaluate(self, event: Mapping[str, Any], ctx: EvaluationContext) -> RuleEvaluationResult:
        ctx.captures = {}
        ctx.missing_fields = []
        try:
            outcome = bool(self._evaluator.evaluate(event, ctx))
        except Exception as exc:
            details = ctx.to_details()
            details.setdefault("rule", {"id": self.id, "mode": self.mode.value, "severity": self.severity})
            return RuleEvaluationResult(False, details, error=exc)
        details = ctx.to_details()
        details.setdefault("rule", {"id": self.id, "mode": self.mode.value, "severity": self.severity})
        return RuleEvaluationResult(outcome, details)


@dataclass
class RuleRuntimeResult:
    rule_id: str
    triggered: bool
    blocked: bool
    code: Optional[str]
    violation_id: Optional[str]
    details: Dict[str, Any]
    error: Optional[Exception] = None
    created_violation: bool = False
    message_override: Optional[str] = None

    @property
    def message(self) -> str:
        if self.message_override:
            return self.message_override
        if self.blocked and self.code == "policy_violation":
            return f"Blocked by policy {self.rule_id}."
        if self.blocked and self.code == "policy_eval_error":
            return f"Evaluation error for policy {self.rule_id}."
        return ""


class RuleRuntime:
    """Manage evaluation bookkeeping, violations, and notifications."""

    def __init__(self) -> None:
        self.metrics: Dict[str, Dict[str, int]] = {}
        self.violations: Dict[str, Dict[str, Any]] = {}
        self.notifications: list[Dict[str, Any]] = []

    # -----------------------------------------------------------------
    def _metric(self, name: str, rule_id: str) -> None:
        bucket = self.metrics.setdefault(name, {})
        bucket[rule_id] = bucket.get(rule_id, 0) + 1

    def _fingerprint(self, rule: Rule, event: Mapping[str, Any]) -> str:
        data = json.dumps({"rule": rule.id, "event": event}, sort_keys=True, default=str)
        return hashlib.sha1(data.encode("utf-8")).hexdigest()

    def upsert_violation(self, rule: Rule, event: Mapping[str, Any], details: Dict[str, Any]) -> Tuple[str, bool]:
        fingerprint = self._fingerprint(rule, event)
        existing = self.violations.get(fingerprint)
        if existing:
            existing["count"] = existing.get("count", 1) + 1
            existing["last_event"] = event
            existing.setdefault("details", {}).update(details)
            existing.setdefault("events", []).append(event)
            created = False
        else:
            violation_id = uuid.uuid4().hex
            self.violations[fingerprint] = {
                "id": violation_id,
                "rule_id": rule.id,
                "count": 1,
                "details": dict(details),
                "events": [event],
            }
            existing = self.violations[fingerprint]
            created = True
        self.notifications.append({"rule_id": rule.id, "violation_id": existing["id"], "created": created})
        return existing["id"], created

    def apply(self, rule: Rule, event: Mapping[str, Any], ctx: EvaluationContext) -> RuleRuntimeResult:
        result = rule.evaluate(event, ctx)
        details = dict(result.details)
        if result.error:
            self._metric("rule_eval_error", rule.id)
            details.setdefault("error", str(result.error))
            blocked = rule.mode is RuleMode.ENFORCE and rule.block_on_error
            code = "policy_eval_error" if blocked else None
            message_override = None
            if blocked:
                template = rule.metadata.get("error_message") if isinstance(rule.metadata, dict) else None
                if isinstance(template, str):
                    try:
                        message_override = template.format(**event)
                    except Exception:
                        message_override = template
            return RuleRuntimeResult(
                rule.id,
                False,
                blocked,
                code,
                None,
                details,
                error=result.error,
                message_override=message_override,
            )
        if not result.triggered:
            details.setdefault("decision", "allow")
            return RuleRuntimeResult(rule.id, False, False, None, None, details)
        violation_id, created = self.upsert_violation(rule, event, details)
        code = "policy_violation" if rule.mode is RuleMode.ENFORCE else None
        blocked = rule.mode is RuleMode.ENFORCE
        message_override = None
        if blocked and isinstance(rule.metadata, dict):
            template = rule.metadata.get("block_message")
            if isinstance(template, str):
                try:
                    message_override = template.format(**event)
                except Exception:
                    message_override = template
        if isinstance(rule.metadata, dict):
            on_match = rule.metadata.get("on_match")
            if isinstance(on_match, Mapping):
                decision = on_match.get("decision")
                reason = on_match.get("reason")
                details.setdefault("decision", decision or ("block" if blocked else "notify"))
                if reason:
                    details.setdefault("reason", reason)
                extra_details = on_match.get("details")
                if isinstance(extra_details, Mapping):
                    details.setdefault("on_match_details", extra_details)
        if "decision" not in details:
            details["decision"] = "block" if blocked else "notify"
        return RuleRuntimeResult(
            rule.id,
            True,
            blocked,
            code,
            violation_id,
            details,
            created_violation=created,
            message_override=message_override,
        )

