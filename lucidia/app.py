"""Simple coding portal for executing Python snippets."""

import ast
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


# --- safety helpers -------------------------------------------------------

# Limit the builtins available to executed user code.  Only a few
# side-effect-free functions are exposed; anything else would raise a
# ``NameError``.  Using a constant dictionary both documents the policy and
# allows the validation step below to reference the allowed names.
SAFE_BUILTINS = {"print": print, "abs": abs, "round": round, "pow": pow}


class CodeValidationError(ValueError):
    """Raised when submitted code contains unsafe operations."""


def _validate(code: str) -> None:
    """Lightweight static analysis to reject obviously unsafe code.

    The checker disallows import statements and attribute access outside of
    the ``math`` module.  It also restricts function calls to the allowed
    builtin names or ``math`` functions.  The intent is not to provide a
    perfect sandbox but to reduce risk from common attack vectors such as
    importing the ``os`` module or accessing ``__subclasses__``.
    """

    tree = ast.parse(code, mode="exec")
    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            raise CodeValidationError("import statements are not allowed")
        if isinstance(node, ast.Attribute):
            if not (isinstance(node.value, ast.Name) and node.value.id == "math"):
                raise CodeValidationError("attribute access restricted to math module")
        if isinstance(node, ast.Call):
            func = node.func
            if isinstance(func, ast.Name):
                if func.id not in SAFE_BUILTINS:
                    raise CodeValidationError(f"call to '{func.id}' is not permitted")
            elif isinstance(func, ast.Attribute):
                if not (isinstance(func.value, ast.Name) and func.value.id == "math"):
                    raise CodeValidationError("only calls to math functions are permitted")


@app.route("/")
def index():
    """Serve the main page."""
    return render_template("index.html")


@app.post("/run")
def run_code():
    """Execute user-supplied Python code and return the output."""
    data = request.get_json(silent=True) or {}
    code = data.get("code", "")

    try:
        _validate(code)
    except CodeValidationError as exc:
        # Reject code that fails the static checks with a clear error message.
        return jsonify({"error": str(exc)}), 400

    local_vars: dict[str, object] = {"math": math}
    stdout = io.StringIO()
    try:
        with redirect_stdout(stdout):
            # ``SAFE_BUILTINS`` is provided via the globals mapping, while
            # ``local_vars`` exposes the math module.  No other globals are
            # accessible to the executed code.
            exec(code, {"__builtins__": SAFE_BUILTINS}, local_vars)
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
