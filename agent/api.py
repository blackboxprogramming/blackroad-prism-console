"""FastAPI surface for agent utilities."""

from __future__ import annotations

import pathlib
import tempfile

from fastapi import FastAPI, File, UploadFile

from agent import transcribe

app = FastAPI(title="BlackRoad Agent API")


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)) -> dict[str, str]:
    """Accept an uploaded audio file and run whisper.cpp locally."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        data = await file.read()
        tmp.write(data)
        tmp_path = pathlib.Path(tmp.name)

    try:
        text = transcribe.run_whisper(str(tmp_path))
    finally:
        tmp_path.unlink(missing_ok=True)

    return {"text": text}
