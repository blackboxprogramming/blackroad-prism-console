from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, List, Mapping, Optional, Sequence


class MissingFieldError(KeyError):
    """Raised when a field lookup fails during rule evaluation."""


_DURATION_UNITS = {
    "s": 1,
    "m": 60,
    "h": 60 * 60,
    "d": 60 * 60 * 24,
}


def duration_from_text(text: str) -> timedelta:
    """Parse compact duration strings such as ``"15m"`` or ``"2h"``."""

    if not text:
        raise ValueError("duration string must be non-empty")
    unit = text[-1]
    if unit not in _DURATION_UNITS:
        raise ValueError(f"unsupported duration unit: {unit!r}")
    try:
        value = float(text[:-1])
    except ValueError as exc:
        raise ValueError(f"invalid duration value: {text}") from exc
    return timedelta(seconds=value * _DURATION_UNITS[unit])


def _ensure_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, tz=timezone.utc)
    if isinstance(value, str):
        # Accept RFC3339/ISO-8601 strings including trailing Z
        if value.endswith("Z"):
            value = value[:-1] + "+00:00"
        return datetime.fromisoformat(value)
    raise TypeError(f"Unsupported datetime representation: {type(value)!r}")


@dataclass
class EvaluationContext:
    """Context shared across rule evaluations and helper functions."""

    series: Sequence[Mapping[str, Any]] = field(default_factory=list)
    baseline: Mapping[str, float] | None = None
    metadata: Mapping[str, Any] | None = None
    now_value: datetime | None = None
    extras: Mapping[str, Any] | None = None

    captures: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    missing_fields: List[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.baseline = dict(self.baseline or {})
        self.metadata = dict(self.metadata or {})
        self.extras = dict(self.extras or {})
        if self.now_value is None:
            self.now_value = datetime.now(timezone.utc)
        elif self.now_value.tzinfo is None:
            self.now_value = self.now_value.replace(tzinfo=timezone.utc)

    # -- value helpers -------------------------------------------------
    def resolve(self, name: str, event: Mapping[str, Any]) -> Any:
        if isinstance(event, Mapping) and name in event:
            return event[name]
        if name in self.metadata:
            return self.metadata[name]
        if name in self.extras:
            return self.extras[name]
        if name in self.baseline:
            return self.baseline[name]
        self.missing_fields.append(name)
        return None

    def has(self, name: str, event: Mapping[str, Any]) -> bool:
        if isinstance(event, Mapping) and name in event:
            return True
        return name in self.metadata or name in self.extras or name in self.baseline

    def record(self, key: str, payload: Dict[str, Any]) -> None:
        self.captures.setdefault(key, []).append(payload)

    # -- builtins exposed to expressions -------------------------------
    def now(self) -> datetime:
        return self.now_value  # type: ignore[return-value]

    def duration(self, text: str) -> timedelta:
        return duration_from_text(text)

    def ingest_lag(self, stream: str) -> timedelta:
        lag = self.metadata.get("ingest_lag", {}).get(stream)
        if lag is None:
            return timedelta(0)
        if isinstance(lag, timedelta):
            return lag
        return duration_from_text(str(lag)) if isinstance(lag, str) else timedelta(seconds=float(lag))

    def baseline_rate(self, metric: str) -> float:
        return float(self.baseline.get(metric, 0.0))

    def last_policy_change_within(self, text: str) -> bool:
        window = duration_from_text(text)
        stamp = self.metadata.get("last_policy_change")
        if stamp is None:
            return False
        ts = _ensure_datetime(stamp)
        delta = self.now() - ts
        return delta <= window

    # -- aggregation helpers ------------------------------------------
    def rate(
        self,
        predicate: Callable[[Mapping[str, Any]], bool],
        window: str,
        include_series: Optional[Sequence[Mapping[str, Any]]] = None,
    ) -> float:
        events = list(include_series or self.series)
        total = len(events)
        if total == 0:
            value = 0.0
            matches: List[Mapping[str, Any]] = []
        else:
            matches = [event for event in events if predicate(event)]
            value = len(matches) / total
        secret_ids = [event.get("secret_id") for event in matches if isinstance(event, Mapping) and "secret_id" in event]
        deduped_secret_ids = sorted({sid for sid in secret_ids if sid is not None})
        self.record(
            "rate",
            {
                "window": window,
                "value": value,
                "matches": len(matches),
                "total": total,
                "matching_events": matches,
                "secret_ids": deduped_secret_ids,
            },
        )
        return value

    def distinct_over(
        self,
        field_name: str,
        window: str,
        include_series: Optional[Sequence[Mapping[str, Any]]] = None,
    ) -> int:
        events = include_series or self.series
        values = []
        for event in events:
            if isinstance(event, Mapping) and field_name in event:
                values.append(event[field_name])
        result = len(set(values))
        self.record(
            "distinct_over",
            {
                "window": window,
                "field": field_name,
                "value": result,
                "total": len(events),
            },
        )
        return result

    def consent_abandonment_ratio(
        self,
        window: str,
        include_series: Optional[Sequence[Mapping[str, Any]]] = None,
    ) -> float:
        events = include_series or self.series
        started = 0
        resolved = 0
        for event in events:
            if not isinstance(event, Mapping):
                continue
            if str(event.get("deny_reason")) == "consent_required":
                started += 1
            if str(event.get("outcome")) == "allow":
                resolved += 1
        ratio = 0.0
        if started > 0:
            abandon = started - resolved
            if abandon < 0:
                abandon = 0
            ratio = abandon / float(started)
        self.record(
            "consent_abandonment_ratio",
            {
                "window": window,
                "value": ratio,
                "started": started,
                "resolved": resolved,
            },
        )
        return ratio

    # -- context assembly ---------------------------------------------
    def with_series(self, series: Sequence[Mapping[str, Any]]) -> "EvaluationContext":
        clone = EvaluationContext(
            series=series,
            baseline=self.baseline,
            metadata=self.metadata,
            now_value=self.now_value,
            extras=self.extras,
        )
        clone.captures = self.captures
        clone.missing_fields = self.missing_fields
        return clone

    def to_details(self) -> Dict[str, Any]:
        details: Dict[str, Any] = {}
        if self.captures:
            details["captures"] = self.captures
        if self.missing_fields:
            details["missing_fields"] = self.missing_fields
        return details

