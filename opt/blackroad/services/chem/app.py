from __future__ import annotations
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from chem_tools import (
    standardize_smiles,
    descriptors_from_smiles,
    embed_and_minimize_uff,
    rmsd_pdb,
    ase_relax_xyz,
    openmm_minimize_pdb,
)

app = FastAPI(title="BlackRoad Chem Service", version="1.0.0")

# ---------- Schemas ----------
class SmilesIn(BaseModel):
    smiles: str = Field(..., description="Input SMILES")

class StdOut(BaseModel):
    canonical_smiles: str
    parent_smiles: str
    neutralized_smiles: str

class DescOut(BaseModel):
    MolWt: float
    TPSA: float
    NumRotatableBonds: int
    NumHBD: int
    NumHBA: int
    RingCount: int
    LogP: float
    HBA_HBD_Sum: int

class ConformerIn(BaseModel):
    smiles: str
    num_confs: int = 10
    seed: int = 7

class ConformerOut(BaseModel):
    canonical_smiles: str
    molblock: str

class RmsdIn(BaseModel):
    pdb_ref: str
    pdb_mobile: str

class RmsdOut(BaseModel):
    rmsd_angstrom: float

class AseRelaxIn(BaseModel):
    xyz: str
    fmax: float = 0.05
    steps: int = 200

class AseRelaxOut(BaseModel):
    xyz: str

class OpenMMMinIn(BaseModel):
    pdb: str
    platform: Optional[str] = None
    max_iters: int = 500

class OpenMMMinOut(BaseModel):
    pdb: str

# ---------- Endpoints ----------
@app.post("/v1/smiles/standardize", response_model=StdOut)
def api_standardize_smiles(body: SmilesIn):
    try:
        return standardize_smiles(body.smiles)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/v1/descriptors", response_model=DescOut)
def api_descriptors(body: SmilesIn):
    try:
        return descriptors_from_smiles(body.smiles)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/v1/conformers/uff_minimize", response_model=ConformerOut)
def api_conformers(body: ConformerIn):
    try:
        return embed_and_minimize_uff(body.smiles, num_confs=body.num_confs, seed=body.seed)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/v1/md/rmsd", response_model=RmsdOut)
def api_rmsd(body: RmsdIn):
    try:
        return {"rmsd_angstrom": rmsd_pdb(body.pdb_ref, body.pdb_mobile)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/v1/ase/relax", response_model=AseRelaxOut)
def api_ase_relax(body: AseRelaxIn):
    try:
        out_xyz = ase_relax_xyz(body.xyz, fmax=body.fmax, steps=body.steps)
        return {"xyz": out_xyz}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/v1/openmm/minimize_pdb", response_model=OpenMMMinOut)
def api_openmm_min(body: OpenMMMinIn):
    try:
        out_pdb = openmm_minimize_pdb(body.pdb, platform=body.platform, max_iters=body.max_iters)
        return {"pdb": out_pdb}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# For local dev: uvicorn app:app --host 0.0.0.0 --port 7014
