from fastapi import FastAPI
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
    pi = telemetry.collect_local()
    jetson = telemetry.collect_remote(JETSON_HOST, user=JETSON_USER)
    return {"pi": pi, "jetson": jetson}


@app.post("/run")
def run_job(req: JobRequest):
    """Run a command on the Jetson."""
    jobs.run_remote(JETSON_HOST, req.command, user=JETSON_USER)
    return {"status": "ok", "command": req.command}


def main():
    uvicorn.run(app, host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
