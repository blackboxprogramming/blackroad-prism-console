import difflib
import os
import time
import zipfile
from pathlib import Path

from flask import Flask, request

app = Flask(__name__)
_start_time = time.time()


def _system_state():
    uptime = time.time() - _start_time
    try:
        load1m = os.getloadavg()[0]
    except (AttributeError, OSError):
        load1m = 0.0
    if load1m < 0.5:
        load_state = "calm"
    elif load1m < 1.5:
        load_state = "engaged"
    else:
        load_state = "stressed"
    try:
        import psutil

        mem_percent = psutil.virtual_memory().percent
    except Exception:
        mem_percent = 0.0
    if mem_percent < 50:
        mem_state = "clear"
    elif mem_percent < 80:
        mem_state = "tight"
    else:
        mem_state = "overwhelmed"
    return {
        "uptime": uptime,
        "load1m": load1m,
        "mem_percent": mem_percent,
        "emotion": f"I feel {load_state} and {mem_state}.",
    }


@app.get("/api/health")
def health() -> tuple[dict, int]:
    """Basic health check."""
    return {"status": "ok", "ts": time.time()}, 200


@app.get("/api/state")
def state() -> tuple[dict, int]:
    """Return basic system state information."""
    return _system_state(), 200


def _project_dir() -> Path:
    return Path(__file__).resolve().parent / "project"


@app.post("/api/code/insert")
def code_insert() -> tuple[dict, int]:
    """Safely append provided code to a project file."""
    data = request.get_json(force=True) or {}
    language = (data.get("language") or "txt").lower()
    code = data.get("code") or ""
    file_hint = data.get("file_hint")

    project_dir = _project_dir()
    project_dir.mkdir(parents=True, exist_ok=True)

    ext_map = {"python": "py", "java": "java", "javascript": "js"}
    ext = ext_map.get(language, "txt")
    file_path = project_dir / (file_hint or f"snippet.{ext}")

    old_content = ""
    if file_path.exists():
        old_content = file_path.read_text()

    header = "\n# --- inserted code ---\n"
    new_content = old_content + header + code + "\n"
    file_path.write_text(new_content)

    diff = "".join(
        difflib.unified_diff(
            old_content.splitlines(keepends=True),
            new_content.splitlines(keepends=True),
            fromfile=str(file_path),
            tofile=str(file_path),
        )
    )
    return {"file": str(file_path), "diff": diff}, 200


@app.post("/api/chat/analyze")
def chat_analyze() -> tuple[dict, int]:
    """Analyze uploaded content and return a trivial answer."""
    data = request.get_json(force=True) or {}
    question = data.get("question") or ""
    text = data.get("text") or ""
    answer = f"Echo: {question} (text length {len(text)})"
    return {"answer": answer}, 200


@app.post("/api/reduce")
def reduce_project() -> tuple[dict, int]:
    """Zip the project directory and report basic stats."""
    project_dir = _project_dir()
    zip_path = Path(__file__).resolve().parent / "compressed.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _dirs, files in os.walk(project_dir):
            for name in files:
                full = Path(root) / name
                zf.write(full, arcname=full.relative_to(project_dir))
    file_count = sum(len(files) for _, _, files in os.walk(project_dir))
    report = {"files": file_count}
    return {"zip": str(zip_path), "report": report}, 200


@app.post("/api/training")
def training() -> tuple[dict, int]:
    """Return a simple markdown training template."""
    data = request.get_json(force=True) or {}
    language = data.get("language") or ""
    focus = data.get("focus") or ""
    content = (
        f"# {language.title()} training for {focus}\n"
        "## Why it matters\n"
        "...\n"
        "## Prereqs\n"
        "...\n"
        "## Step-by-step\n"
        "...\n"
        "## Common pitfalls\n"
        "...\n"
        "## Next steps\n"
        "...\n"
    )
    return {"tutorial": content}, 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
