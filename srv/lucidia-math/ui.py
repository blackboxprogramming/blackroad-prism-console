"""Flask API for the Infinity Math system."""
from flask import Flask, send_from_directory, jsonify
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "output"

app = Flask(__name__)


@app.get("/health")
def health() -> tuple:
    return jsonify({"status": "ok"})


@app.get("/api/math/<path:subpath>")
def get_output(subpath: str):
    """Serve generated artifacts from the output tree."""
    return send_from_directory(OUTPUT_DIR, subpath)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8500)
