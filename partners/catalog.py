from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Dict, Optional

import yaml

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts" / "partners"


@dataclass
class Partner:
    id: str
    name: str
    tier: str
    regions: List[str]
    strengths: List[str]
    certs: List[str]


@dataclass
class Listing:
    id: str
    partner_id: str
    sku: str
    version: str
    price: float
    capabilities: List[str]
    requirements: List[str]
    status: str


def load_catalog(dir_path: Path) -> Dict[str, List[Dict]]:
    partners: List[Dict] = []
    listings: List[Dict] = []
    for path in sorted(dir_path.glob("*.yaml")):
        data = yaml.safe_load(Path(path).read_text()) or {}
        p = data.get("partner", {})
        partner = Partner(
            id=p.get("id"),
            name=p.get("name"),
            tier=p.get("tier"),
            regions=p.get("regions", []),
            strengths=p.get("strengths", []),
            certs=p.get("certs", []),
        )
        partners.append(asdict(partner))
        for lst in data.get("listings", []):
            listing = Listing(
                id=lst.get("id"),
                partner_id=partner.id,
                sku=lst.get("sku"),
                version=lst.get("version"),
                price=float(lst.get("price", 0)),
                capabilities=lst.get("capabilities", []),
                requirements=lst.get("requirements", []),
                status=lst.get("status", "inactive"),
            )
            listings.append(asdict(listing))
    catalog = {"partners": partners, "listings": listings}
    storage.write(str(ARTIFACTS / "catalog.json"), catalog)
    return catalog


def _load_catalog_from_artifacts() -> Dict[str, List[Dict]]:
    raw = storage.read(str(ARTIFACTS / "catalog.json"))
    return json.loads(raw) if raw else {"partners": [], "listings": []}


def list_partners(tier: Optional[str] = None, region: Optional[str] = None) -> List[Dict]:
    data = _load_catalog_from_artifacts()
    partners = data.get("partners", [])
    if tier:
        partners = [p for p in partners if p.get("tier") == tier]
    if region:
        partners = [p for p in partners if region in p.get("regions", [])]
    return partners


def show_partner(pid: str) -> Optional[Dict]:
    data = _load_catalog_from_artifacts()
    for p in data.get("partners", []):
        if p.get("id") == pid:
            p = dict(p)
            p["listings"] = [
                lst
                for lst in data.get("listings", [])
                if lst.get("partner_id") == pid
            ]
            return p
    return None
