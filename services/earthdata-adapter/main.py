"""Earthdata Adapter FastAPI service scaffold.

This service proxies AppEEARS job information and provides basic COG tiling.
The implementation is guarded by the FEATURE_EARTHDATA_ADAPTER environment
variable, which defaults to disabled. Real credentials and network calls are
intentionally omitted in this scaffold.
"""

from typing import Any, Dict
import os

from fastapi import FastAPI, HTTPException

app = FastAPI()

FEATURE_EARTHDATA_ADAPTER = os.getenv("FEATURE_EARTHDATA_ADAPTER", "false").lower() == "true"


def _feature_guard() -> None:
    """Raise an HTTP error if the adapter feature is disabled."""
    if not FEATURE_EARTHDATA_ADAPTER:
        raise HTTPException(status_code=503, detail="earthdata adapter disabled")


@app.get("/health")
def health() -> Dict[str, Any]:
    """Health check endpoint."""
    return {"status": "ok", "feature_enabled": FEATURE_EARTHDATA_ADAPTER}


@app.post("/appeears/jobs:list")
def list_jobs() -> Dict[str, Any]:
    """Return a placeholder list of AppEEARS jobs."""
    _feature_guard()
    return {"jobs": []}


@app.get("/appeears/jobs/{job_id}")
def get_job(job_id: str) -> Dict[str, Any]:
    """Return placeholder metadata for a specific job."""
    _feature_guard()
    return {"id": job_id, "status": "unknown"}


@app.get("/appeears/jobs/{job_id}/assets")
def get_job_assets(job_id: str) -> Dict[str, Any]:
    """Return a stub STAC item for job assets."""
    _feature_guard()
    return {"id": job_id, "assets": []}


@app.get("/cog/tiles/{z}/{x}/{y}")
def cog_tiles(z: int, x: int, y: int) -> Dict[str, Any]:
    """Return placeholder tile coordinates for a COG."""
    _feature_guard()
    return {"tile": [z, x, y]}
