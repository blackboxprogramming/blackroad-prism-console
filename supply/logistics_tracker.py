from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, List

LOGISTICS_FILE = Path(__file__).with_name("logistics.json")


@dataclass
class Shipment:
    id: str
    vendor: str
    items: List[str]
    carrier: str
    incoterms: str
    eta: str


@dataclass
class LogisticsData:
    shipments: List[Shipment]
    tiers: Dict[str, List[str]]


def _load() -> LogisticsData:
    if not LOGISTICS_FILE.exists():
        return LogisticsData(shipments=[], tiers={})
    data = json.loads(LOGISTICS_FILE.read_text())
    shipments = [Shipment(**s) for s in data.get("shipments", [])]
    tiers = data.get("tiers", {})
    return LogisticsData(shipments=shipments, tiers=tiers)


def _save(data: LogisticsData) -> None:
    LOGISTICS_FILE.write_text(
        json.dumps(
            {
                "shipments": [asdict(s) for s in data.shipments],
                "tiers": data.tiers,
            },
            indent=2,
        )
    )


def _lucidia_log(event: Dict) -> None:
    try:
        from lucidia import memory  # type: ignore

        memory.record(event)
    except Exception:
        pass


def add_shipment(shipment: Shipment) -> None:
    data = _load()
    data.shipments.append(shipment)
    _save(data)
    _lucidia_log({"type": "shipment", "id": shipment.id, "eta": shipment.eta})


def list_shipments() -> List[Shipment]:
    return _load().shipments


def update_tier_mapping(vendor: str, deps: List[str]) -> None:
    data = _load()
    data.tiers[vendor] = deps
    _save(data)


def get_tier_mapping() -> Dict[str, List[str]]:
    return _load().tiers


def detect_single_source() -> List[str]:
    tiers = get_tier_mapping()
    return [v for v, deps in tiers.items() if len(deps) <= 1]
