"""
Optional microservice wrapper (FastAPI). Exposes:
  GET  /state        -> basis params, K
  POST /update       -> body: {"x": [ ... ]} returns metrics {"F_t","L_t","Phi_spec"}
  POST /supervise    -> body: {"y_hat": [...], "y_true": [...]}
  POST /save         -> body: {"path": "/opt/lucidia/state/lucidia_sine_state.npz"}
  POST /load         -> body: {"path": "..."}
Start:
  uvicorn sine_service:app --host 0.0.0.0 --port 8707
"""
import json
import numpy as np

try:
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel
    HAVE_FASTAPI = True
except Exception:
    HAVE_FASTAPI = False

from lucidia_sine_pack import LucidiaSine

if not HAVE_FASTAPI:
    raise SystemExit("FastAPI not installed. `pip install fastapi uvicorn`")

app = FastAPI(title="Lucidia Sine Service", version="1.0.0")

# Default singleton
LUC = LucidiaSine(n_dims=4, dt=0.01, K=6, tau=0.5)

class UpdateIn(BaseModel):
    x: list

class SuperviseIn(BaseModel):
    y_hat: list
    y_true: list

class PathIn(BaseModel):
    path: str

@app.get("/state")
def state():
    sd = LUC.update(np.zeros(LUC.cfg.n_dims))  # no-op update tick with zeros
    return {
        "K": sd["state_dump"]["K"],
        "omega": sd["state_dump"]["omega"].tolist(),
        "phi": sd["state_dump"]["phi"].tolist(),
        "amp": sd["state_dump"]["amp"].tolist(),
    }

@app.post("/update")
def update(inp: UpdateIn):
    x = np.array(inp.x, dtype=float)
    if x.shape[0] != LUC.cfg.n_dims:
        raise HTTPException(400, f"Expected vector of length {LUC.cfg.n_dims}")
    out = LUC.update(x)
    return {
        "M_t": out["M_t"].tolist(),
        "F_t": out["F_t"],
        "L_t": out["L_t"],
        "Phi_spec": out["Phi_spec"],
        "K": out["state_dump"]["K"],
    }

@app.post("/supervise")
def supervise(inp: SuperviseIn):
    y_hat = np.array(inp.y_hat, dtype=float)
    y_true = np.array(inp.y_true, dtype=float)
    LUC.notify_supervision(y_hat=y_hat, y_true=y_true)
    return {"ok": True}

@app.post("/save")
def save(inp: PathIn):
    LUC.save_state(inp.path)
    return {"saved": inp.path}

@app.post("/load")
def load(inp: PathIn):
    global LUC
    LUC = LucidiaSine.load_state(inp.path)
    return {"loaded": inp.path}
