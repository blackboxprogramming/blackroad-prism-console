"""Simple coding portal for executing Python snippets."""

import io
import math
import os
import re
import subprocess
from contextlib import redirect_stdout
from pathlib import Path

import sympy as sp
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
    local_vars: dict[str, object] = {"math": math}
    safe_builtins = {"print": print, "abs": abs, "round": round, "pow": pow}
    stdout = io.StringIO()
    try:
        with redirect_stdout(stdout):
            exec(code, {"__builtins__": safe_builtins}, local_vars)
        output = stdout.getvalue()
    except Exception as exc:  # noqa: BLE001 - broad for user feedback
        output = f"Error: {exc}"
    return jsonify({"output": output})


@app.post("/math")
def evaluate_math():
    """Evaluate a mathematical expression and optionally report its derivative."""
    data = request.get_json(silent=True) or {}
    expr = data.get("expression")
    if not expr:
        return jsonify({"error": "missing expression"}), 400
    curious = data.get("curious")
    try:
        sym_expr = sp.sympify(expr)
    except sp.SympifyError as exc:
        return jsonify({"error": str(exc)}), 400
    response: dict[str, str] = {"result": str(sym_expr)}
    if curious:
        symbols = list(sym_expr.free_symbols)
        if symbols:
            response["derivative"] = str(sp.diff(sym_expr, symbols[0]))
    return jsonify(response)


@app.post("/install")
def install_package():
    """Install a Python package via ``pip`` within the environment."""
    data = request.get_json(silent=True) or {}
    package = data.get("package")
    if not package:
        return jsonify({"error": "missing package"}), 400

    if not re.fullmatch(r"[A-Za-z0-9_.-]+(?:==[A-Za-z0-9_.-]+)?", package):
        return jsonify({"error": "invalid package spec"}), 400
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
    if not (repo_path / ".git").exists():
        return jsonify({"error": "not a git repo"}), 400
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
