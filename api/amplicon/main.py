from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel

app = FastAPI(title="Amplicon API")


class JobResponse(BaseModel):
    """Response model for amplicon jobs."""

    job_id: str
    status: str | None = None


@app.post("/api/jobs/amplicon", response_model=JobResponse)
async def submit_job(runsheet: UploadFile = File(...)) -> JobResponse:
    """Placeholder endpoint accepting a runsheet CSV.
    In production this would enqueue an offline Nextflow run and return a job id."""
    # The file is ignored; implement job queuing here.
    return JobResponse(job_id="demo")


@app.get("/api/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str) -> JobResponse:
    """Return stub status for a job."""
    return JobResponse(job_id=job_id, status="pending")


@app.get("/health")
async def health() -> dict[str, bool]:
    """Simple health check."""
    return {"ok": True}


@app.get("/")
async def root():
    return {"ok": True}
