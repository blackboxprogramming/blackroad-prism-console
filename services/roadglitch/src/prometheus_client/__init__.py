from __future__ import annotations

from typing import Dict, Tuple


class _Metric:
    def __init__(self, name: str, labelnames: Tuple[str, ...]):
        self.name = name
        self.labelnames = labelnames
        self.samples: Dict[Tuple[str, ...], float] = {}

    def labels(self, **labels: str) -> "_Sample":
        key = tuple(labels.get(label, "") for label in self.labelnames)
        if key not in self.samples:
            self.samples[key] = 0.0
        return _Sample(self.samples, key)


class _Sample:
    def __init__(self, store: Dict[Tuple[str, ...], float], key: Tuple[str, ...]):
        self.store = store
        self.key = key

    def inc(self, amount: float = 1.0) -> None:
        self.store[self.key] = self.store.get(self.key, 0.0) + amount

    def observe(self, value: float) -> None:
        self.inc(value)


class Counter(_Metric):
    pass


class Gauge(_Metric):
    pass


class Histogram(_Metric):
    pass


_METRICS: Dict[str, _Metric] = {}


def _register(metric: _Metric) -> _Metric:
    _METRICS[metric.name] = metric
    return metric


def Counter(name: str, documentation: str, labelnames: Tuple[str, ...] = ()) -> Counter:  # type: ignore[override]
    return _register(_Metric(name, labelnames))  # type: ignore[return-value]


def Gauge(name: str, documentation: str, labelnames: Tuple[str, ...] = ()) -> Gauge:  # type: ignore[override]
    return _register(_Metric(name, labelnames))  # type: ignore[return-value]


def Histogram(name: str, documentation: str, labelnames: Tuple[str, ...] = ()) -> Histogram:  # type: ignore[override]
    return _register(_Metric(name, labelnames))  # type: ignore[return-value]


def generate_latest() -> bytes:
    lines = []
    for metric in _METRICS.values():
        for labels, value in metric.samples.items():
            label_str = ",".join(
                f"{name}=\"{val}\"" for name, val in zip(metric.labelnames, labels) if val
            )
            if label_str:
                lines.append(f"{metric.name}{{{label_str}}} {value}")
            else:
                lines.append(f"{metric.name} {value}")
    return "\n".join(lines).encode()


__all__ = ["Counter", "Gauge", "Histogram", "generate_latest"]

