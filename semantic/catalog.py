from dataclasses import dataclass
from typing import Callable, Dict, List


def revenue(rows):
    return sum(r.get("amount", 0) for r in rows)


def gross_margin_pct(rows):
    revenue_sum = sum(r.get("amount", 0) for r in rows)
    profit_sum = sum(r.get("profit", 0) for r in rows)
    return (profit_sum / revenue_sum * 100) if revenue_sum else 0


def uptime(rows):
    downtime = sum(r.get("downtime", 0) for r in rows)
    window = sum(r.get("window", 1) for r in rows)
    return 100 - (downtime / window * 100) if window else 0


@dataclass
class Metric:
    id: str
    sql: Callable
    owner: str
    unit: str
    description: str


@dataclass
class Dimension:
    id: str
    fields: List[str]
    description: str


class SemanticModel:
    def __init__(self):
        self.metrics: Dict[str, Metric] = {
            "revenue": Metric("revenue", revenue, "finance", "USD", "Total revenue"),
            "gross_margin_pct": Metric(
                "gross_margin_pct", gross_margin_pct, "finance", "%", "Gross margin percentage"
            ),
            "uptime": Metric("uptime", uptime, "reliability", "%", "Service uptime"),
        }
        self.dimensions: Dict[str, Dimension] = {
            "date": Dimension("date", ["date"], "Calendar date"),
            "region": Dimension("region", ["region"], "Geographic region"),
            "product": Dimension("product", ["product"], "Product name"),
            "segment": Dimension("segment", ["segment"], "Customer segment"),
        }

