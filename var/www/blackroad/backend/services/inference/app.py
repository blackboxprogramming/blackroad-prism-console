import asyncio
import logging
import os
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

os.makedirs("logs", exist_ok=True)

logger = logging.getLogger("inference")
logger.setLevel(logging.INFO)
handler = RotatingFileHandler("logs/inference.log", maxBytes=1048576, backupCount=3)
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)

app = FastAPI()

class InferenceRequest(BaseModel):
    input: str

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/v1/infer")
async def infer(payload: InferenceRequest):
    logger.info("Infer request: %s", payload.input)
    result = payload.input[::-1]
    return {"output": result}

@app.get("/v1/stream")
async def stream():
    async def event_generator():
        for token in ["hello", "from", "blackroad"]:
            yield f"data: {token}\n\n"
            await asyncio.sleep(0.5)
    return StreamingResponse(event_generator(), media_type="text/event-stream")
