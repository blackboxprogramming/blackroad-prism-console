import os
import pathlib
import subprocess
import time
import uuid
from typing import Optional

from fastapi import FastAPI
from pydantic import BaseModel

from .lucidia_bridge import log_contradiction, log_event

APP_ID = "glow-agent"
ROOT = pathlib.Path(__file__).resolve().parents[1]
VENDOR = ROOT / "vendor" / "glow-pytorch"
MODEL_DIR = pathlib.Path(os.getenv("MODEL_DIR", "/opt/blackroad/models/glow"))
DATA_DIR = pathlib.Path(os.getenv("DATA_DIR", "/opt/blackroad/data"))
LOG_DIR = pathlib.Path(os.getenv("LOG_DIR", "/opt/blackroad/logs"))

app = FastAPI(title="BlackRoad Glow Agent", version="1.0.0")


class TrainReq(BaseModel):
    dataset_dir: Optional[str] = None
    img_size: int = 64
    batch: int = 16
    lr: float = 1e-4
    epochs: int = 1
    bits: int = 5
    n_flow: int = 32
    n_block: int = 3
    seed: int = 0


class SampleReq(BaseModel):
    n: int = 8
    temperature: float = 0.7
    seed: int = 0
    out_size: int = 64


def _python():
    return "python3"


@app.get("/health")
def health():
    return {"ok": True, "app": APP_ID}


@app.post("/train")
def train(req: TrainReq):
    dataset = req.dataset_dir or str(DATA_DIR / "glow_data")
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(LOG_DIR, exist_ok=True)
    run_id = f"glow-{int(time.time())}-{uuid.uuid4().hex[:6]}"

    cmd = [
        _python(),
        str(VENDOR / "train.py"),
        dataset,
        "--image_size",
        str(req.img_size),
        "--batch",
        str(req.batch),
        "--lr",
        str(req.lr),
        "--epochs",
        str(req.epochs),
        "--bits",
        str(req.bits),
        "--n_flow",
        str(req.n_flow),
        "--n_block",
        str(req.n_block),
        "--seed",
        str(req.seed),
        "--ckpt",
        str(MODEL_DIR / f"{run_id}.pt"),
    ]

    log_event(agent=APP_ID, action="train:start", payload={"cmd": cmd, "run_id": run_id})
    try:
        sp = subprocess.run(cmd, cwd=str(VENDOR), check=True, capture_output=True, text=True)
        (LOG_DIR / f"{run_id}.train.log").write_text(sp.stdout + "\n\n" + sp.stderr)
        log_event(agent=APP_ID, action="train:done", payload={"run_id": run_id})
        return {"ok": True, "run_id": run_id}
    except subprocess.CalledProcessError as e:
        log_contradiction(APP_ID, "train_failed", {"stderr": e.stderr})
        return {"ok": False, "error": "train_failed", "detail": e.stderr}


@app.post("/sample")
def sample(req: SampleReq):
    from .engine import autodiscover_ckpt, sample_grid_b64

    ckpt = autodiscover_ckpt(MODEL_DIR)
    if ckpt is None:
        log_contradiction(APP_ID, "sample_no_checkpoint", {})
        return {"ok": False, "error": "no_checkpoint"}
    b64 = sample_grid_b64(
        ckpt,
        n=req.n,
        temperature=req.temperature,
        out_size=req.out_size,
        seed=req.seed,
    )
    log_event(
        agent=APP_ID,
        action="sample",
        payload={"n": req.n, "temperature": req.temperature},
    )
    return {"ok": True, "image_b64": b64}
