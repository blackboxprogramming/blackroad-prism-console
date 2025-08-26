import io
import os
import struct

from fastapi import FastAPI
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse
from pydantic import BaseModel
from runtime.ollama_client import chat as ollama_chat

LUCIDIA_MODEL = os.getenv("LUCIDIA_MODEL", "lucidia")
app = FastAPI()


class ChatBody(BaseModel):
    messages: list
    model: str | None = None
    stream: bool = True


class VideoBody(BaseModel):
    """Request body for simple video generation."""

    prompt: str
    frame_delay: int | None = 20


class HealthResponse(BaseModel):
    """Response model for service health."""

    ok: bool
    model: str


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Basic service health."""
    return HealthResponse(ok=True, model=LUCIDIA_MODEL)

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


def _gif_from_text(text: str, frame_delay: int = 20) -> bytes:
    """Create a tiny animated GIF from ``text`` without external deps.

    Each character maps to a single 1x1 pixel frame with a deterministic
    colour derived from ``ord(char)``.  The animation is minimal but
    demonstrates video generation capability in constrained environments.
    """

    if not text:
        text = " "
    width = height = 1
    buf = bytearray()
    buf.extend(b"GIF89a")
    buf.extend(struct.pack("<HHBBB", width, height, 0x00, 0, 0))
    buf.extend(b"\x21\xFF\x0BNETSCAPE2.0\x03\x01\x00\x00\x00")
    for ch in text:
        r = ord(ch) % 256
        g = (ord(ch) * 3) % 256
        b = (ord(ch) * 7) % 256
        buf.extend(b"\x21\xF9\x04\x00" + struct.pack("<H", frame_delay) + b"\x00\x00")
        buf.extend(b"\x2C\x00\x00\x00\x00\x01\x00\x01\x00\x80\x00")
        buf.extend(bytes([r, g, b, 0, 0, 0]))
        buf.extend(b"\x02\x02L\x01\x00")
    buf.extend(b";")
    return bytes(buf)


@app.post("/video")
async def video(body: VideoBody):
    data = _gif_from_text(body.prompt, body.frame_delay or 20)
    return StreamingResponse(io.BytesIO(data), media_type="image/gif")

@app.get("/")
async def root():
    return PlainTextResponse("Lucidia API OK")
