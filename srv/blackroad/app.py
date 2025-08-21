import json
import os
import time
from datetime import datetime
from pathlib import Path
import uuid
import boto3

from dotenv import load_dotenv
from flask import (
    Flask,
    Response,
    jsonify,
    make_response,
    request,
    send_from_directory,
    stream_with_context,
)
from flask_cors import CORS

load_dotenv()

APP_ROOT = Path(__file__).resolve().parent
PROMPTS_DIR = APP_ROOT / "prompts"

# ---- Config ----
LLM_BACKEND = os.getenv("LLM_BACKEND", "ollama").lower()  # "ollama" | "llamacpp"
AUTH_BEARER = os.getenv("AUTH_BEARER", "").strip()
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
DEFAULT_PRESET = os.getenv("DEFAULT_PRESET", "codex")  # "codex" | "lucidia" | "chit_chat"
SYSTEM_PROMPT_PATH = os.getenv("SYSTEM_PROMPT_PATH", str(PROMPTS_DIR / "codex_system_prompt.txt"))

# ---- Backend init ----
if LLM_BACKEND == "ollama":
    from backends.ollama_backend import OllamaBackend as Backend

    BACKEND = Backend(
        host=os.getenv("OLLAMA_HOST", "http://localhost:11434"),
        default_model=os.getenv("OLLAMA_MODEL", "phi3:mini"),
    )
elif LLM_BACKEND == "llamacpp":
    from backends.llamacpp_backend import LlamaCppBackend as Backend

    BACKEND = Backend(
        host=os.getenv("LLAMACPP_HOST", "http://localhost:8080"),
        default_model=os.getenv("LLAMACPP_MODEL", "llama3.1"),
    )
else:
    raise SystemExit(f"Unknown LLM_BACKEND '{LLM_BACKEND}'")

app = Flask(__name__, static_folder="static")
CORS(app, resources={r"/api/*": {"origins": CORS_ORIGINS}})


# ---- Helpers ----
def _auth_guard():
    if not AUTH_BEARER:
        return None
    auth = request.headers.get("Authorization", "")
    if auth != f"Bearer {AUTH_BEARER}":
        return make_response(("Unauthorized", 401))
    return None


def _load_system_prompt(preset: str) -> str:
    """
    Load the system prompt. 'preset' allows you to branch behavior without extra files if desired.
    """
    path = Path(SYSTEM_PROMPT_PATH)
    if not path.exists():
        # Minimal fallback if prompt file missing
        return "You are Codex Infinity inside Lucidia. Be precise, honest, and contradiction-aware. NEVER LIE."
    text = path.read_text(encoding="utf-8")
    # Light runtime variables injected for breath/identity without altering the file content
    breath = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    stamp = f"\n\n[breath:{breath}] [preset:{preset}] [backend:{LLM_BACKEND}]"
    return text.strip() + stamp


def _inject_system(messages, system_prompt):
    msgs = messages or []
    if not msgs or msgs[0].get("role") != "system":
        return [{"role": "system", "content": system_prompt}, *msgs]
    # If a system message exists, prepend ours for highest priority
    return [{"role": "system", "content": system_prompt}, *msgs]


def _sse(data: dict, event: str = "delta"):
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


# ---- Routes ----
@app.get("/health")
def health():
    err = _auth_guard()
    if err:
        return err
    h = BACKEND.health()
    return jsonify(
        {
            "app": "blackroad-lucidia-chitchat",
            "backend": h,
            "time_utc": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        }
    )


@app.get("/")
def root():
    # Serve the minimal dev UI
    return send_from_directory(app.static_folder, "lucidia-dev.html")


@app.post("/api/chitchat")
def api_chit_chat():
    err = _auth_guard()
    if err:
        return err

    payload = request.get_json(force=True, silent=True) or {}
    messages = payload.get("messages") or []
    stream = bool(payload.get("stream", True))
    preset = (payload.get("preset") or DEFAULT_PRESET).lower()
    model = payload.get("model") or None
    temperature = float(payload.get("temperature") or 0.7)
    top_p = float(payload.get("top_p") or 0.9)
    max_tokens = int(payload.get("max_tokens") or 1024)

    system_prompt = _load_system_prompt(preset)
    merged = _inject_system(messages, system_prompt)

    if stream:
        start = time.time()

        @stream_with_context
        def generate():
            # Make proxies stream-friendly (disable buffering at proxies like nginx)
            yield _sse({"status": "open"}, "open")
            acc = []
            for delta in BACKEND.stream_chat(
                merged, model=model, temperature=temperature, top_p=top_p, max_tokens=max_tokens
            ):
                acc.append(delta)
                yield _sse({"content": delta}, "delta")
            full_text = "".join(acc)
            elapsed_ms = int((time.time() - start) * 1000)
            yield _sse({"content": full_text, "elapsed_ms": elapsed_ms}, "done")

        resp = Response(generate(), mimetype="text/event-stream")
        # Disable proxy buffering
        resp.headers["Cache-Control"] = "no-cache"
        resp.headers["X-Accel-Buffering"] = "no"
        return resp

    # Non-stream mode
    text = BACKEND.complete_chat(
        merged, model=model, temperature=temperature, top_p=top_p, max_tokens=max_tokens
    )
    return jsonify({"content": text})


@app.get("/api/models")
def api_models():
    err = _auth_guard()
    if err:
        return err
    return jsonify(BACKEND.models())


@app.get("/api/prompt")
def api_prompt():
    err = _auth_guard()
    if err:
        return err
    preset = (request.args.get("preset") or DEFAULT_PRESET).lower()
    return Response(_load_system_prompt(preset), mimetype="text/plain")


@app.post("/api/datasets/upload")
def api_datasets_upload():
    err = _auth_guard()
    if err:
        return err
    file = request.files.get("file")
    if not file:
        return ("No file", 400)
    bucket = os.getenv("S3_BUCKET", "blackroad-datasets")
    key = f"uploads/{uuid.uuid4()}_{file.filename}"
    s3 = boto3.client("s3")
    s3.upload_fileobj(file.stream, bucket, key)
    return jsonify({"ok": True, "key": key})


@app.get("/api/llm/stream")
def api_llm_stream():
    err = _auth_guard()
    if err:
        return err
    prompt = request.args.get("prompt", "")

    def generate():
        for token in BACKEND.stream_chat([{ "role": "user", "content": prompt }]):
            yield f"data: {token}\n\n"
        yield "event: done\n\n"

    resp = Response(stream_with_context(generate()), mimetype="text/event-stream")
    resp.headers["Cache-Control"] = "no-cache"
    resp.headers["X-Accel-Buffering"] = "no"
    return resp


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), threaded=True)
