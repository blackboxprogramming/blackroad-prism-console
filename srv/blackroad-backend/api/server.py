"""
Lucidia API Server – WebSocket + REST
Exposes Roadie and Guardian functions via simple endpoints.
"""
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from agents.roadie import Roadie
from agents.guardian import Guardian

app = FastAPI(title="Lucidia API")

# Instantiate agents pointing at the memory directory
roadie = Roadie(memory_dir="/srv/blackroad-backend/memory")
guardian = Guardian(memory_dir="/srv/blackroad-backend/memory")


@app.get("/")
def home():
    return {"status": "Lucidia API online"}


@app.get("/search/{query}")
def search(query: str):
    results = roadie.search(query)
    return JSONResponse(content={"results": results})


@app.get("/audit")
def audit():
    result = guardian.verify_integrity()
    return JSONResponse(content={"result": result})
