from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from agent import telemetry, jobs

app = FastAPI(title="BlackRoad API")

JETSON_HOST = "jetson.local"
JETSON_USER = "jetson"


class JobRequest(BaseModel):
    command: str


@app.get("/status")
def status():
    """Return telemetry for Pi and Jetson."""
    try:
        pi = telemetry.collect_local()
    except telemetry.TelemetryError as exc:
        pi = {"status": "error", "detail": str(exc)}

    try:
        jetson = telemetry.collect_remote(JETSON_HOST, user=JETSON_USER)
    except telemetry.TelemetryError as exc:
        jetson = {"status": "error", "detail": str(exc)}

    return {"pi": pi, "jetson": jetson}


@app.post("/run")
def run_job(req: JobRequest):
    """Run a command on the Jetson."""
    try:
        result = jobs.run_remote(JETSON_HOST, req.command, user=JETSON_USER)
    except jobs.JobError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return result


def main():
    uvicorn.run(app, host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
