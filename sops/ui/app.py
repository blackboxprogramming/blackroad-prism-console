"""Flask stub for browsing and triggering SOPs."""
from __future__ import annotations

from pathlib import Path

import yaml
from flask import Flask, jsonify

from sops.engine import engine

app = Flask(__name__)


@app.get("/sops")
def list_sops():
    names: list[str] = []
    root = Path(__file__).resolve().parents[1]
    for path in root.glob("*.yaml"):
        data = yaml.safe_load(path.read_text()) or {}
        names.extend(data.keys())
    return jsonify(names)


@app.post("/sops/<name>/run")
def run_sop(name: str):
    record = engine.run(name)
    return jsonify({"record": str(record)})


if __name__ == "__main__":  # pragma: no cover
    app.run(debug=True)
