import os, json, asyncio
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse, PlainTextResponse
from pydantic import BaseModel
from runtime.ollama_client import chat as ollama_chat

LUCIDIA_MODEL = os.getenv("LUCIDIA_MODEL", "lucidia")
app = FastAPI()

class ChatBody(BaseModel):
    messages: list
    model: str | None = None
    stream: bool = True

@app.get("/health")
async def health():
    return {"ok": True, "model": LUCIDIA_MODEL}

@app.post("/chat")
async def chat(body: ChatBody):
    model = body.model or LUCIDIA_MODEL
    if body.stream:
        async def gen():
            async for chunk in ollama_chat(model, body.messages, stream=True):
                yield chunk
        return StreamingResponse(gen(), media_type="application/json")
    else:
        data = await ollama_chat(model, body.messages, stream=False)
        return JSONResponse(data)

@app.get("/")
async def root():
    return PlainTextResponse("Lucidia API OK")
