"""Simple coding portal for executing Python snippets."""

import io
import os
from contextlib import redirect_stdout

from flask import Flask, jsonify, render_template, request

# Expose a restricted set of safe built-in functions to executed code.
SAFE_BUILTINS: dict[str, object] = {
    "abs": abs,
    "enumerate": enumerate,
    "len": len,
    "list": list,
    "max": max,
    "min": min,
    "print": print,
    "range": range,
    "sum": sum,
}

# Preserve variables and functions defined across runs.
GLOBAL_VARS: dict[str, object] = {}

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
    stdout = io.StringIO()
    try:
        with redirect_stdout(stdout):
            exec(code, {"__builtins__": SAFE_BUILTINS}, GLOBAL_VARS)
        output = stdout.getvalue()
    except Exception as exc:  # noqa: BLE001 - broad for user feedback
        output = f"Error: {exc}"
    return jsonify({"output": output})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
