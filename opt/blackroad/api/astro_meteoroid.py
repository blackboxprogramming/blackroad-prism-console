# FastAPI router: offline meteoroid environment compute endpoint
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, confloat
import numpy as np

from lucidia.astro.meteoroid_env.api import (
    number_density,
    encounter_velocities,
    OrbitalElements,
    TargetPoint,
)
from lucidia.astro.meteoroid_env.units import (
    au_to_m,
)

router = APIRouter(prefix="/api/astro/meteoroid", tags=["astro"])


class SolveRequest(BaseModel):
    a: confloat(gt=0)
    e: confloat(ge=0, lt=1)
    i: confloat(ge=0, le=float(np.pi))   # radians
    x: float
    y: float
    z: float
    units: str = Field("SI", pattern="^(SI|astro)$")


class SolveResponse(BaseModel):
    density_SI: float          # 1/m^3
    density_astro: float       # 1/AU^3
    velocities_SI: list[list[float]]     # m/s
    velocities_astro: list[list[float]]  # km/s
    branch_count: int


@router.post("/solve", response_model=SolveResponse)
def solve(req: SolveRequest) -> SolveResponse:
    # Convert positions/semi-major axis to SI if provided in astro units
    if req.units == "astro":
        a_m = au_to_m(req.a)
        x_m = au_to_m(req.x); y_m = au_to_m(req.y); z_m = au_to_m(req.z)
    else:
        a_m = float(req.a)
        x_m = float(req.x); y_m = float(req.y); z_m = float(req.z)

    # Security/sanity bounds (offline guardrails)
    AU_M = au_to_m(1.0)
    if not (-100*AU_M <= x_m <= 100*AU_M and -100*AU_M <= y_m <= 100*AU_M and -10*AU_M <= z_m <= 10*AU_M):
        raise HTTPException(status_code=400, detail="TargetPoint out of safe bounds.")
    if not (au_to_m(0.05) <= a_m <= au_to_m(40.0)):
        raise HTTPException(status_code=400, detail="Semi-major axis out of safe bounds.")

    elems = OrbitalElements(a=a_m, e=float(req.e), i=float(req.i))
    tp = TargetPoint(x=x_m, y=y_m, z=z_m)

    try:
        rho = number_density(elems, tp)                 # 1/m^3
        V = encounter_velocities(elems, tp)             # (N,3) m/s
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    density_SI = float(rho)
    density_astro = density_SI * (AU_M ** 3)           # 1/AU^3
    velocities_SI = V.tolist()
    velocities_astro = (V / 1000.0).tolist()           # km/s

    return SolveResponse(
        density_SI=density_SI,
        density_astro=density_astro,
        velocities_SI=velocities_SI,
        velocities_astro=velocities_astro,
        branch_count=len(velocities_SI),
    )
