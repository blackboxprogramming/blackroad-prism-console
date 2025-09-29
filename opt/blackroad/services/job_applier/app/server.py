from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse, PlainTextResponse, Response
from pathlib import Path
import os, json
from .models import ApplyRequest
from . import aih_runner, assets

app = FastAPI(title="Job Applier (AIHawk wrapper)")

DATA_DIR = Path(os.environ.get("JOB_APPLIER_DATA_DIR", "/data"))
RUNS_DIR = DATA_DIR / "runs"
RUNS_DIR.mkdir(parents=True, exist_ok=True)

@app.get("/health")
def health():
    return {"ok": True, "runs_dir": str(RUNS_DIR)}

@app.post("/apply")
def apply(req: ApplyRequest, bg: BackgroundTasks):
    run_id = aih_runner.start_run(
        job_urls=[str(u) for u in req.job_urls],
        resume_text=req.resume_text,
        cover_template=req.cover_template,
        dry_run=req.dry_run
    )
    bg.add_task(aih_runner.run_aihawk, run_id)
    return {"run_id": run_id, "status_url": f"/runs/{run_id}"}

@app.get("/runs/{run_id}")
def run_status(run_id: str):
    run_dir = RUNS_DIR / run_id
    if not run_dir.exists():
        return JSONResponse({"error": "not found"}, status_code=404)
    meta = json.loads((run_dir / "run.json").read_text())
    return meta

@app.get("/runs/{run_id}/logs/{kind}", response_class=PlainTextResponse)
def run_logs(run_id: str, kind: str):
    run_dir = RUNS_DIR / run_id
    path = run_dir / (f"{kind}.log")
    if not path.exists():
        return PlainTextResponse("", status_code=204)
    return path.read_text()


@app.get("/assets")
def asset_index():
    """List available static assets for downstream automations."""

    return {"assets": assets.list_assets()}


@app.get("/assets/{asset_key}")
def asset_detail(asset_key: str):
    """Return the requested asset content."""

    try:
        asset = assets.get_asset(asset_key)
    except KeyError as exc:  # pragma: no cover - fastapi handles HTTPException
        raise HTTPException(status_code=404, detail="asset_not_found") from exc

    payload = asset.load()
    if asset.media_type == "application/json":
        return JSONResponse(payload)
    if asset.media_type == "text/plain":
        return PlainTextResponse(payload)
    return Response(content=payload, media_type=asset.media_type)
