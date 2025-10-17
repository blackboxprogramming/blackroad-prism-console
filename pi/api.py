"""FastAPI application exposing the Pi transcription workflow."""

from __future__ import annotations

import asyncio
import functools
import json
import subprocess
import uuid
from pathlib import Path
from typing import Dict, List, Tuple

from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from agent.config import active_target
from agent import store, transcribe


app = FastAPI(title="BlackRoad Pi API")


def _validate_token(token: str) -> str:
    if not token:
        raise ValueError("missing token")
    name = Path(token).name
    if name != token:
        raise ValueError("invalid token")
    return token


def _local_transcribe(path: str, model: str, lang: str, beam: int) -> List[str]:
    from faster_whisper import WhisperModel

    cache_key = (model, "cpu")
    if cache_key not in _LOCAL_MODEL_CACHE:
        _LOCAL_MODEL_CACHE[cache_key] = WhisperModel(
            model, device="cpu", compute_type="int8"
        )
    whisper_model = _LOCAL_MODEL_CACHE[cache_key]
    language = None if lang == "auto" else lang
    segments, _ = whisper_model.transcribe(path, language=language, beam_size=beam)
    return [f"[{seg.start:.2f}-{seg.end:.2f}] {seg.text}" for seg in segments]


_LOCAL_MODEL_CACHE: Dict[Tuple[str, str], object] = {}


@app.post("/transcribe/upload")
async def upload_audio(file: UploadFile = File(...)) -> JSONResponse:
    if file is None:
        raise HTTPException(400, "file required")

    data = await file.read()
    if not data:
        raise HTTPException(400, "empty file")

    dest = transcribe.allocate_path(file.filename)
    dest.write_bytes(data)
    return JSONResponse({"token": dest.name})


@app.websocket("/ws/transcribe/run")
async def ws_transcribe_run(ws: WebSocket) -> None:
    await ws.accept()
    session_id = None
    finished = False
    try:
        payload = await ws.receive_text()
        req = json.loads(payload)
        token = _validate_token(req.get("token", ""))
        lang = req.get("lang", "en")
        model = req.get("model", "base")
        beam = max(1, int(req.get("beam", 5)))

        local_path = (transcribe.TMP_DIR / token).resolve()
        if not local_path.exists():
            await ws.send_text("[error] missing audio")
            return

        session_id = req.get("session") or f"cpu-{uuid.uuid4().hex[:8]}"
        store.transcript_start(session_id)
        await ws.send_text(f"[[BLACKROAD_SESSION:{session_id}]]")

        loop = asyncio.get_running_loop()
        lines = await loop.run_in_executor(
            None,
            functools.partial(
                _local_transcribe, str(local_path), model, lang, max(1, beam)
            ),
        )

        for line in lines:
            store.transcript_append(session_id, line + "\n")
            await ws.send_text(line)

        store.transcript_finish(session_id)
        finished = True
        await ws.send_text("[[BLACKROAD_WHISPER_DONE]]")
    except WebSocketDisconnect:
        pass
    except Exception as exc:  # noqa: BLE001 - convert to stream message
        message = f"[error] {exc}"
        if session_id:
            store.transcript_append(session_id, message + "\n")
        await ws.send_text(message)
    finally:
        if session_id and not finished:
            store.transcript_finish(session_id)
        await ws.close()


@app.websocket("/ws/transcribe/run_gpu")
async def ws_transcribe_gpu(ws: WebSocket) -> None:
    await ws.accept()
    session_id = None
    finished = False
    proc: subprocess.Popen[str] | None = None
    host: str | None = None
    user: str | None = None
    remote_path: str | None = None
    try:
        payload = await ws.receive_text()
        req = json.loads(payload)
        token = _validate_token(req.get("token", ""))
        lang = req.get("lang", "en")
        model = req.get("model", "base")
        beam = max(1, int(req.get("beam", 5)))

        local_path = (transcribe.TMP_DIR / token).resolve()
        if not local_path.exists():
            await ws.send_text("[error] missing audio")
            return

        host, user = active_target()
        remote_dir = "/tmp/blackroad_whisper"
        remote_path = f"{remote_dir}/{token}"

        subprocess.check_call(["ssh", f"{user}@{host}", "mkdir", "-p", remote_dir])
        subprocess.check_call(
            ["scp", str(local_path), f"{user}@{host}:{remote_path}"]
        )

        session_id = req.get("session") or f"gpu-{uuid.uuid4().hex[:8]}"
        store.transcript_start(session_id)
        await ws.send_text(f"[[BLACKROAD_SESSION:{session_id}]]")

        remote_py = f"""
import os
from faster_whisper import WhisperModel

model_name = {model!r}
audio_path = {remote_path!r}
lang = {lang!r}
beam = {beam}
device = "cuda" if os.environ.get("USE_CUDA", "1") == "1" else "cpu"

model = WhisperModel(model_name, device=device, compute_type="float16" if device == "cuda" else "int8")
segments, _ = model.transcribe(audio_path, language=None if lang == "auto" else lang, beam_size=beam)
for seg in segments:
    print(f"[{{seg.start:.2f}}-{{seg.end:.2f}}] {{seg.text}}", flush=True)
print("[[BLACKROAD_WHISPER_DONE]]", flush=True)
"""

        proc = subprocess.Popen(  # noqa: PLP2004 - streaming stdout
            ["ssh", f"{user}@{host}", "python3", "-u", "-c", remote_py],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

        assert proc.stdout is not None
        saw_done = False
        for raw_line in proc.stdout:
            line = raw_line.rstrip("\n")
            if not line:
                continue
            if line == "[[BLACKROAD_WHISPER_DONE]]":
                saw_done = True
                continue
            store.transcript_append(session_id, line + "\n")
            await ws.send_text(line)

        return_code = proc.wait()
        if return_code != 0:
            raise RuntimeError(f"remote whisper exited with {return_code}")

        store.transcript_finish(session_id)
        finished = True
        await ws.send_text("[[BLACKROAD_WHISPER_DONE]]")
    except WebSocketDisconnect:
        pass
    except subprocess.CalledProcessError as exc:
        message = f"[error] {exc}"
        if session_id:
            store.transcript_append(session_id, message + "\n")
        await ws.send_text(message)
    except Exception as exc:  # noqa: BLE001 - convert to stream message
        message = f"[error] {exc}"
        if session_id:
            store.transcript_append(session_id, message + "\n")
        await ws.send_text(message)
    finally:
        if proc and proc.stdout:
            proc.stdout.close()
        if remote_path and host and user:
            subprocess.run(
                ["ssh", f"{user}@{host}", "rm", "-f", remote_path],
                check=False,
            )
        if session_id and not finished:
            store.transcript_finish(session_id)
        await ws.close()


@app.get("/transcripts/{session}")
def get_transcript(session: str) -> JSONResponse:
    doc = store.transcript_get(session)
    if not doc:
        return JSONResponse({"error": "not found"}, status_code=404)
    return JSONResponse(doc)


__all__ = ["app"]

