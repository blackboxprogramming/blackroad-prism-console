"""FastAPI application for Pi dashboard transcription with Jetson offload."""
from __future__ import annotations

import asyncio
import json
import logging
import uuid
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from agent import store, transcribe
from agent.config import active_target

logger = logging.getLogger(__name__)
app = FastAPI(title="BlackRoad Pi Dashboard", version="0.1.0")


async def _run_checked(cmd: list[str]) -> None:
    """Execute a command and raise if it fails."""
    proc = await asyncio.create_subprocess_exec(*cmd)
    code = await proc.wait()
    if code != 0:
        raise RuntimeError(f"command {' '.join(cmd)} exited with {code}")


@app.post("/transcribe/upload")
async def upload_audio(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file:
        raise HTTPException(status_code=400, detail="missing file")

    suffix = Path(file.filename or "audio").suffix
    token = f"{uuid.uuid4().hex}{suffix}"
    dest = transcribe.TMP_DIR / token
    size = 0
    try:
        with dest.open("wb") as out:
            while True:
                chunk = await file.read(1 << 20)
                if not chunk:
                    break
                out.write(chunk)
                size += len(chunk)
    except Exception as exc:  # pragma: no cover - defensive
        if dest.exists():
            dest.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"upload failed: {exc}")

    if size == 0:
        dest.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="empty file")

    return {"token": token, "size": size}


async def _stream_remote_python(cmd: list[str], ws: WebSocket, session: str) -> bool:
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        limit=1 << 16,
    )
    done_seen = False
    try:
        assert proc.stdout is not None
        while True:
            line = await proc.stdout.readline()
            if not line:
                break
            text = line.decode("utf-8", errors="replace").rstrip("\r\n")
            if not text:
                continue
            if text == "[[BLACKROAD_WHISPER_DONE]]":
                done_seen = True
            store.transcript_append(session, text + "\n")
            await ws.send_text(text)
    finally:
        if proc.stdout:
            proc.stdout.close()
        await proc.wait()
    return done_seen


@app.websocket("/ws/transcribe/run_gpu")
async def ws_transcribe_gpu(ws: WebSocket) -> None:
    await ws.accept()
    session: Optional[str] = None
    done_sent = False
    try:
        message = await ws.receive_text()
        try:
            req = json.loads(message)
        except json.JSONDecodeError:
            await ws.send_text("[error] invalid payload")
            return

        token = str(req.get("token") or "").strip()
        lang = (req.get("lang") or "en").strip()
        model = (req.get("model") or "base").strip()
        beam = int(req.get("beam") or 5)
        if not token:
            await ws.send_text("[error] missing token")
            return

        local_path = (transcribe.TMP_DIR / token).resolve()
        if not local_path.exists():
            await ws.send_text("[error] file not found")
            return

        session = (req.get("session") or f"gpu-{uuid.uuid4().hex[:8]}")
        store.transcript_start(session)
        await ws.send_text(f"[[BLACKROAD_SESSION:{session}]]")

        host, user = active_target()
        remote_dir = "/tmp/blackroad_whisper"
        remote_path = f"{remote_dir}/{token}"

        await _run_checked(["ssh", f"{user}@{host}", "mkdir", "-p", remote_dir])
        await _run_checked(["scp", str(local_path), f"{user}@{host}:{remote_path}"])

        py = f"""
import os
from faster_whisper import WhisperModel

model_name = {model!r}
audio_path = {remote_path!r}
lang = {lang!r}
beam = {beam}
device = "cuda" if os.environ.get("USE_CUDA", "1") == "1" else "cpu"

model = WhisperModel(model_name, device=device, compute_type="float16" if device == "cuda" else "int8")
segments, info = model.transcribe(audio_path, language=None if lang == "auto" else lang, beam_size=beam)
for seg in segments:
    print(f"[{{seg.start:.2f}}-{{seg.end:.2f}}] {{seg.text}}", flush=True)
print("[[BLACKROAD_WHISPER_DONE]]", flush=True)
"""
        cmd = ["ssh", f"{user}@{host}", "python3", "-u", "-c", py]
        done_sent = await _stream_remote_python(cmd, ws, session)
        store.transcript_finish(session)
    except WebSocketDisconnect:
        if session:
            store.transcript_finish(session)
        return
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("GPU transcription failed: %s", exc)
        if session:
            store.transcript_append(session, f"[error] {exc}\n")
            store.transcript_finish(session)
        await ws.send_text(f"[error] {exc}")
    finally:
        if session and not done_sent:
            try:
                await ws.send_text("[[BLACKROAD_WHISPER_DONE]]")
            except Exception:  # pragma: no cover - defensive
                pass
        try:
            await ws.close()
        except Exception:  # pragma: no cover - defensive
            pass


@app.get("/transcripts/{session}")
async def get_transcript(session: str) -> JSONResponse:
    data = store.transcript_get(session)
    if not data:
        return JSONResponse({"error": "not found"}, status_code=404)
    return JSONResponse(data)
