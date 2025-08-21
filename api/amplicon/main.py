from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI(title="Amplicon API")


@app.post("/api/jobs/amplicon")
async def submit_job(runsheet: UploadFile = File(...)):
    """Placeholder endpoint accepting a runsheet CSV.
    In production this would enqueue an offline Nextflow run and return a job id."""
    # The file is ignored; implement job queuing here.
    return {"job_id": "demo"}


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    """Return stub status for a job."""
    return JSONResponse({"job_id": job_id, "status": "pending"})


@app.get("/")
async def root():
    return {"ok": True}
