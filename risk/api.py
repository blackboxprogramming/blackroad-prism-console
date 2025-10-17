"""Minimal risk and compliance API using FastAPI."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import List

import yaml
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Compliance Fabric")

REGISTER_FILE = Path(__file__).with_name("register.yaml")
COMPLIANCE_FILE = Path(__file__).with_name("compliance_mapping.yaml")
EVIDENCE_FILE = Path(__file__).with_name("evidence.yaml")


# ---------------------------------------------------------------------------
# Utilities


def _load(path: Path) -> list:
    if path.exists():
        with path.open("r", encoding="utf-8") as f:
            return yaml.safe_load(f) or []
    return []


def _save(path: Path, data: list) -> None:
    with path.open("w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, sort_keys=False)


# ---------------------------------------------------------------------------
# Models


class Risk(BaseModel):
    id: str
    description: str
    owner: str
    mitigation: str
    impact: float
    likelihood: float
    residual_risk: float | None = None


class ControlMapping(BaseModel):
    framework: str
    control: str
    internal_policy: str
    evidence: List[str]


class Evidence(BaseModel):
    id: str
    source_system: str
    timestamp: datetime
    hash: str
    reviewer: str


# ---------------------------------------------------------------------------
# Risk registry endpoints


@app.get("/risk/registry", response_model=List[Risk])
def list_risks() -> List[Risk]:
    return _load(REGISTER_FILE)


@app.post("/risk/registry", response_model=Risk)
def create_risk(risk: Risk) -> Risk:
    data = _load(REGISTER_FILE)
    if any(item["id"] == risk.id for item in data):
        raise HTTPException(status_code=400, detail="Risk id already exists")
    data.append(risk.dict())
    _save(REGISTER_FILE, data)
    return risk


@app.get("/risk/registry/{risk_id}", response_model=Risk)
def get_risk(risk_id: str) -> Risk:
    data = _load(REGISTER_FILE)
    for item in data:
        if item["id"] == risk_id:
            return item
    raise HTTPException(status_code=404, detail="Risk not found")


@app.put("/risk/registry/{risk_id}", response_model=Risk)
def update_risk(risk_id: str, risk: Risk) -> Risk:
    data = _load(REGISTER_FILE)
    for i, item in enumerate(data):
        if item["id"] == risk_id:
            data[i] = risk.dict()
            _save(REGISTER_FILE, data)
            return risk
    raise HTTPException(status_code=404, detail="Risk not found")


@app.delete("/risk/registry/{risk_id}")
def delete_risk(risk_id: str) -> None:
    data = _load(REGISTER_FILE)
    new_data = [item for item in data if item["id"] != risk_id]
    if len(new_data) == len(data):
        raise HTTPException(status_code=404, detail="Risk not found")
    _save(REGISTER_FILE, new_data)
    return None


# ---------------------------------------------------------------------------
# Compliance mapping endpoints


@app.get("/compliance/mapping", response_model=List[ControlMapping])
def list_mappings() -> List[ControlMapping]:
    return _load(COMPLIANCE_FILE)


@app.post("/compliance/mapping", response_model=ControlMapping)
def create_mapping(mapping: ControlMapping) -> ControlMapping:
    data = _load(COMPLIANCE_FILE)
    data.append(mapping.dict())
    _save(COMPLIANCE_FILE, data)
    return mapping


# ---------------------------------------------------------------------------
# Audit evidence endpoints


@app.get("/audit/evidence", response_model=List[Evidence])
def list_evidence() -> List[Evidence]:
    return _load(EVIDENCE_FILE)


@app.post("/audit/evidence", response_model=Evidence)
def add_evidence(evidence: Evidence) -> Evidence:
    data = _load(EVIDENCE_FILE)
    data.append(evidence.dict())
    _save(EVIDENCE_FILE, data)
    return evidence


# ---------------------------------------------------------------------------
# Placeholder hook for remediation actions


@app.post("/compliance/remediate/{framework}")
def trigger_remediation(framework: str) -> dict:
    """Stub endpoint for Codex agent remediation hooks."""
    return {"framework": framework, "status": "remediation triggered"}
