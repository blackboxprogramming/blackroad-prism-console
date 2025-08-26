"""Simple coding portal for executing Python snippets."""

import io
import os
import subprocess
from contextlib import redirect_stdout
from pathlib import Path

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)


@app.route("/")
def index():
    """Serve the main page."""
    return render_template("index.html")


@app.post("/run")
def run_code():
    """Execute user-supplied Python code and return the output."""
    data = request.get_json(silent=True) or {}
    code = data.get("code", "")
    local_vars: dict[str, object] = {}
    stdout = io.StringIO()
    try:
        with redirect_stdout(stdout):
            exec(code, {"__builtins__": {"print": print}}, local_vars)
        output = stdout.getvalue()
    except Exception as exc:  # noqa: BLE001 - broad for user feedback
        output = f"Error: {exc}"
    return jsonify({"output": output})


@app.post("/install")
def install_package():
    """Install a Python package via ``pip`` within the environment."""
    data = request.get_json(silent=True) or {}
    package = data.get("package")
    if not package:
        return jsonify({"error": "missing package"}), 400
    proc = subprocess.run(
        ["pip", "install", package],
        capture_output=True,
        text=True,
    )
    return (
        jsonify({"code": proc.returncode, "stdout": proc.stdout, "stderr": proc.stderr}),
        200 if proc.returncode == 0 else 500,
    )


@app.post("/git/clean")
def git_clean():
    """Reset and remove untracked files from a git repository."""
    data = request.get_json(silent=True) or {}
    repo_path = Path(data.get("path", "."))
    if not repo_path.is_dir():
        return jsonify({"error": "invalid path"}), 400
    reset = subprocess.run(
        ["git", "reset", "--hard"],
        cwd=repo_path,
        capture_output=True,
        text=True,
    )
    clean = subprocess.run(
        ["git", "clean", "-ffdx"],
        cwd=repo_path,
        capture_output=True,
        text=True,
    )
    output = reset.stdout + reset.stderr + clean.stdout + clean.stderr
    code = reset.returncode or clean.returncode
    return (
        jsonify({"code": code, "output": output}),
        200 if code == 0 else 500,
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
