from __future__ import annotations

import glob
import json
from dataclasses import dataclass, asdict
from typing import Dict, List

import yaml

from tools import storage, metrics, artifacts


@dataclass
class Service:
    id: str
    name: str
    tier: int
    owners: List[str]
    sli: Dict[str, float]
    dependencies: List[str]


def load_services(path: str = "configs/services/*.yaml") -> List[Service]:
    service_schema_path = "schemas/service.schema.json"
    services: List[Service] = []
    schema = json.loads(storage.read(service_schema_path)) if storage.read(service_schema_path) else None
    for file in sorted(glob.glob(path)):
        data = yaml.safe_load(storage.read(file))
        svc = Service(**data)
        if schema:
            import jsonschema

            jsonschema.validate(asdict(svc), schema)
        services.append(svc)
    catalog = [asdict(s) for s in services]
    # validate catalog as array if schema present
    if schema:
        import jsonschema

        jsonschema.validate(catalog, {"type": "array", "items": schema})
    artifacts.validate_and_write("artifacts/services/catalog.json", catalog)
    metrics.emit("svc_catalog_loaded", len(services))
    return services
