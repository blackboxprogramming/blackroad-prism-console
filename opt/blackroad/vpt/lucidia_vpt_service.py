#!/usr/bin/env python3
import os, sys, json, time, psutil, asyncio, subprocess, shlex, signal, pathlib, logging
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel
import yaml

# --- Config load ---
BASE = pathlib.Path(__file__).resolve().parent
with open(BASE / "config" / "vpt.config.yml", "r") as f:
    CFG = yaml.safe_load(f)

VPT_REPO = pathlib.Path(CFG["vpt_repo_dir"])
PYBIN = CFG["python_bin"]
MODELS = pathlib.Path(CFG["models_dir"])
WEIGHTS = pathlib.Path(CFG["weights_dir"])
LOGS = pathlib.Path(CFG["logs_dir"])
RUNTIME = pathlib.Path(CFG["runtime_dir"])
TOKEN_FILE = pathlib.Path(CFG["token_file"])
XVFB = pathlib.Path(CFG.get("xvfb_bin", "/usr/bin/xvfb-run"))
HEADLESS = bool(CFG.get("headless", True))
DEFAULT_MODEL = CFG.get("default_model", "")
DEFAULT_WEIGHTS = CFG.get("default_weights", "")
DEFAULT_ENV = CFG.get("minerl_env", "MineRLTreechop-v0")

LOGS.mkdir(parents=True, exist_ok=True)
RUNTIME.mkdir(parents=True, exist_ok=True)

# --- Auth ---
def require_auth(req: Request):
    auth = req.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = auth[len("Bearer "):].strip()
    expected = TOKEN_FILE.read_text().strip() if TOKEN_FILE.exists() else ""
    if token != expected:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Models ---
class StartAgentReq(BaseModel):
    model: Optional[str] = None
    weights: Optional[str] = None
    minerl_env: Optional[str] = None
    headless: Optional[bool] = None
    extra_args: Optional[str] = None  # free-form args to run_agent.py

class StopAgentReq(BaseModel):
    pid: Optional[int] = None

class IdmReq(BaseModel):
    idm_model: str
    idm_weights: str
    video_path: Optional[str] = None
    jsonl_path: Optional[str] = None

app = FastAPI(title="Lucidia VPT Service", version="1.0.0")

# --- Helpers ---
PID_FILE = RUNTIME / "agent.pid"
LOG_FILE = LOGS / f"agent_{int(time.time())}.log"

def _build_agent_cmd(model_path, weights_path, minerl_env, extra_args):
    run_agent_py = VPT_REPO / "run_agent.py"
    if not run_agent_py.exists():
        raise RuntimeError(f"Missing run_agent.py at {run_agent_py}")
    base_cmd = [
        str(PYBIN), str(run_agent_py),
        "--model", str(model_path),
        "--weights", str(weights_path),
    ]
    if minerl_env:
        # Many run_agent variants auto-pick env; keep arg to future-proof
        os.environ["MINERL_ENV"] = minerl_env
    if extra_args:
        base_cmd += shlex.split(extra_args)
    if HEADLESS or CFG.get("headless"):
        if XVFB.exists():
            return [str(XVFB), "-a"] + base_cmd
    return base_cmd

def _spawn(cmd, log_path):
    with open(log_path, "ab", buffering=0) as lf:
        # Start detached so we can manage separately
        proc = subprocess.Popen(cmd, stdout=lf, stderr=lf, preexec_fn=os.setsid)
    PID_FILE.write_text(str(proc.pid))
    return proc.pid

def _proc_alive(pid:int)->bool:
    try:
        return psutil.Process(pid).is_running()
    except Exception:
        return False

# --- Routes ---
@app.get("/health")
async def health():
    return {"ok": True, "repo": str(VPT_REPO), "venv": str(PYBIN), "headless": HEADLESS}

@app.get("/agent/status")
async def agent_status():
    if PID_FILE.exists():
        pid = int(PID_FILE.read_text())
        return {"running": _proc_alive(pid), "pid": pid, "log": str(LOG_FILE)}
    return {"running": False, "pid": None}

@app.post("/agent/start")
async def agent_start(req: Request, body: StartAgentReq):
    require_auth(req)
    if PID_FILE.exists():
        pid = int(PID_FILE.read_text())
        if _proc_alive(pid):
            raise HTTPException(status_code=409, detail=f"Agent already running (pid {pid})")

    model = body.model or DEFAULT_MODEL
    weights = body.weights or DEFAULT_WEIGHTS
    minerl_env = body.minerl_env or DEFAULT_ENV
    if body.headless is not None:
        CFG["headless"] = bool(body.headless)  # session override

    model_path = (MODELS / model) if not os.path.isabs(model) else pathlib.Path(model)
    weights_path = (WEIGHTS / weights) if not os.path.isabs(weights) else pathlib.Path(weights)

    if not model_path.exists():
        raise HTTPException(400, f"Model not found: {model_path}")
    if not weights_path.exists():
        raise HTTPException(400, f"Weights not found: {weights_path}")

    cmd = _build_agent_cmd(model_path, weights_path, minerl_env, body.extra_args or "")
    pid = _spawn(cmd, LOG_FILE)
    return {"started": True, "pid": pid, "cmd": cmd, "log": str(LOG_FILE)}

@app.post("/agent/stop")
async def agent_stop(req: Request, body: StopAgentReq):
    require_auth(req)
    pid = body.pid
    if pid is None:
        if PID_FILE.exists():
            pid = int(PID_FILE.read_text())
        else:
            return {"stopped": False, "reason": "no pid"}
    try:
        os.killpg(os.getpgid(pid), signal.SIGTERM)
        time.sleep(0.5)
        if _proc_alive(pid):
            os.killpg(os.getpgid(pid), signal.SIGKILL)
        PID_FILE.unlink(missing_ok=True)
        return {"stopped": True, "pid": pid}
    except Exception as e:
        raise HTTPException(500, f"Failed to stop pid {pid}: {e}")

@app.get("/logs/tail")
async def logs_tail(lines: int = 200):
    if not LOG_FILE.exists():
        return PlainTextResponse("no logs yet\n")
    content = subprocess.check_output(["tail", "-n", str(lines), str(LOG_FILE)])
    return PlainTextResponse(content.decode("utf-8", errors="ignore"))

@app.post("/idm/predict")
async def idm_predict(req: Request, body: IdmReq):
    require_auth(req)
    run_idm_py = VPT_REPO / "run_inverse_dynamics_model.py"
    if not run_idm_py.exists():
        raise HTTPException(404, f"Missing IDM runner: {run_idm_py}")

    idm_model = (MODELS / body.idm_model) if not os.path.isabs(body.idm_model) else pathlib.Path(body.idm_model)
    idm_weights = (WEIGHTS / body.idm_weights) if not os.path.isabs(body.idm_weights) else pathlib.Path(body.idm_weights)

    if not idm_model.exists(): raise HTTPException(400, f"IDM model not found: {idm_model}")
    if not idm_weights.exists(): raise HTTPException(400, f"IDM weights not found: {idm_weights}")
    if body.video_path and not pathlib.Path(body.video_path).exists(): raise HTTPException(400, f"video not found: {body.video_path}")
    if body.jsonl_path and not pathlib.Path(body.jsonl_path).exists(): raise HTTPException(400, f"jsonl not found: {body.jsonl_path}")

    cmd = [str(PYBIN), str(run_idm_py), "--model", str(idm_model), "--weights", str(idm_weights)]
    if body.video_path: cmd += ["--video-path", str(body.video_path)]
    if body.jsonl_path: cmd += ["--jsonl-path", str(body.jsonl_path)]

    proc = subprocess.run(cmd, capture_output=True)
    if proc.returncode != 0:
        raise HTTPException(500, f"IDM failed: {proc.stderr.decode()}")
    # Best effort: return any JSON lines the script might emit; otherwise raw text
    out = proc.stdout.decode()
    try:
        # Extract JSON if present; otherwise ship text block
        json_obj = json.loads(out)
        return JSONResponse(json_obj)
    except Exception:
        return PlainTextResponse(out)
