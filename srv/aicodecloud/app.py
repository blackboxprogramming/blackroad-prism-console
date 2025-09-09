from flask import Flask, jsonify
import time
import os

app = Flask(__name__)
_start_time = time.time()


def _system_state():
    uptime = time.time() - _start_time
    try:
        load1m = os.getloadavg()[0]
    except OSError:
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
    return {"status": "ok"}, 200


@app.get("/api/state")
def state() -> tuple[dict, int]:
    """Return basic system state information."""
    return _system_state(), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
