import os
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from agent import telemetry, jobs

app = FastAPI(title="BlackRoad API")

JETSON_HOST = os.getenv("JETSON_HOST", "jetson.local")
JETSON_USER = os.getenv("JETSON_USER", "jetson")


class JobRequest(BaseModel):
    command: str


@app.get("/status")
def status():
    return {
        "target": {"host": JETSON_HOST, "user": JETSON_USER},
        "pi": telemetry.collect_local(),
        "jetson": telemetry.collect_remote(JETSON_HOST, JETSON_USER),
    }


@app.post("/run")
def run_job(req: JobRequest):
    jobs.run_remote(JETSON_HOST, req.command, JETSON_USER)
    return {"ok": True, "command": req.command}


def main():
    uvicorn.run(app, host="0.0.0.0", port=8080)
