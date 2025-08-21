import hashlib
import json
import os
import pathlib
import time

BUS_PATH = pathlib.Path(os.getenv("LUCIDIA_BUS", "/opt/blackroad/bus/codex_bus.jsonl"))
LOG_DIR = pathlib.Path(os.getenv("LOG_DIR", "/opt/blackroad/logs"))
LOG_DIR.mkdir(parents=True, exist_ok=True)


def _ps_sha_inf(s: str) -> str:
    return hashlib.sha256(("PS-SHA∞|" + s).encode()).hexdigest()


def log_event(agent: str, action: str, payload: dict):
    rec = {
        "t": time.time(),
        "agent": agent,
        "action": action,
        "payload": payload,
        "truth": 1,
        "hash": _ps_sha_inf(json.dumps(payload, sort_keys=True)),
    }
    BUS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(BUS_PATH, "a") as f:
        f.write(json.dumps(rec) + "\n")
    with open(LOG_DIR / "glow.events.log", "a") as f:
        f.write(json.dumps(rec) + "\n")


def log_contradiction(agent: str, reason: str, payload: dict):
    rec = {
        "t": time.time(),
        "agent": agent,
        "action": "contradiction",
        "reason": reason,
        "payload": payload,
        "truth": -1,
        "hash": _ps_sha_inf(json.dumps(payload, sort_keys=True)),
    }
    BUS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(BUS_PATH, "a") as f:
        f.write(json.dumps(rec) + "\n")
    with open(LOG_DIR / "glow.contradictions.log", "a") as f:
        f.write(json.dumps(rec) + "\n")
