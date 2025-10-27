"""FastAPI application exposing the Pi transcription workflow."""

from __future__ import annotations

import asyncio
import functools
import json
import re
import subprocess
import uuid
from asyncio.subprocess import PIPE as ASYNC_PIPE
from pathlib import Path
from typing import Dict, List, Optional, Tuple

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


_PING_COUNT = 2
_PING_TIMEOUT_S = 2
_PING_PACKET_RE = re.compile(
    r"(?P<sent>\d+)\s+packets transmitted,\s+(?P<received>\d+)\s+received,\s+"
    r"(?P<loss>[\d.]+)% packet loss"
)
_PING_TIME_RE = re.compile(r"time=([\d.]+)\s*ms")


def _trim_output(text: str, limit: int = 4000) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    return f"{text[:limit]}… (truncated {len(text) - limit} chars)"


def _parse_ping(stdout: str) -> Dict[str, Optional[float | int]]:
    latency: Optional[float] = None
    transmitted: Optional[int] = None
    received: Optional[int] = None
    packet_loss: Optional[float] = None

    for line in stdout.splitlines():
        match = _PING_TIME_RE.search(line)
        if match:
            try:
                latency = float(match.group(1))
            except ValueError:
                latency = None
            break

    for line in stdout.splitlines():
        if "packet loss" not in line:
            continue
        match = _PING_PACKET_RE.search(line)
        if match:
            try:
                transmitted = int(match.group("sent"))
            except ValueError:
                transmitted = None
            try:
                received = int(match.group("received"))
            except ValueError:
                received = None
            try:
                packet_loss = float(match.group("loss"))
            except ValueError:
                packet_loss = None
            break

    return {
        "latency_ms": latency,
        "packets_transmitted": transmitted,
        "packets_received": received,
        "packet_loss_percent": packet_loss,
    }


async def _run_ping(host: str) -> Tuple[int, str, str]:
    cmd = [
        "ping",
        "-c",
        str(_PING_COUNT),
        "-W",
        str(_PING_TIMEOUT_S),
        host,
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=ASYNC_PIPE,
        stderr=ASYNC_PIPE,
    )
    stdout_bytes, stderr_bytes = await proc.communicate()
    stdout = stdout_bytes.decode("utf-8", errors="replace")
    stderr = stderr_bytes.decode("utf-8", errors="replace")
    return proc.returncode or 0, stdout, stderr


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


@app.get("/ping")
async def ping_pi() -> JSONResponse:
    host, user = active_target()
    if not host:
        raise HTTPException(503, "no active target configured")

    try:
        exit_code, stdout, stderr = await _run_ping(host)
    except FileNotFoundError as exc:  # pragma: no cover - system dependent
        raise HTTPException(status_code=500, detail="ping command not available") from exc
    except OSError as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=f"failed to execute ping: {exc}") from exc

    parsed = _parse_ping(stdout)
    payload: Dict[str, object] = {
        "ok": exit_code == 0,
        "host": host,
        "user": user,
        "exit_code": exit_code,
        "latency_ms": parsed["latency_ms"],
        "packet_loss_percent": parsed["packet_loss_percent"],
        "packets_transmitted": parsed["packets_transmitted"],
        "packets_received": parsed["packets_received"],
        "stdout": _trim_output(stdout),
    }
    if stderr.strip():
        payload["stderr"] = _trim_output(stderr)

    return JSONResponse(payload, status_code=200)


__all__ = ["app"]

