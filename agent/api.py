"""FastAPI application exposing BlackRoad agent controls."""
from __future__ import annotations

import json
import pathlib
import subprocess
from typing import Any, Dict

from fastapi import Body, FastAPI, WebSocket, WebSocketDisconnect

from agent import flash, jobs, telemetry
from agent.config import active_target, load as load_cfg, set_target

app = FastAPI(title="BlackRoad Agent")


class ConnectionManager:
    """Minimal WebSocket manager for streaming logs."""

    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._connections.discard(websocket)

    async def broadcast(self, message: str) -> None:
        for ws in list(self._connections):
            try:
                await ws.send_text(message)
            except RuntimeError:
                self.disconnect(ws)


manager = ConnectionManager()


@app.websocket("/ws/logs")
async def logs_websocket(websocket: WebSocket) -> None:
    """Simple echo socket that allows clients to keep an open channel."""
    await manager.connect(websocket)
    try:
        while True:
            try:
                payload = await websocket.receive_text()
            except RuntimeError:
                break
            await manager.broadcast(json.dumps({"echo": payload}))
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)


@app.get("/settings")
def get_settings() -> Dict[str, Any]:
    """Return the active Jetson settings and raw configuration."""
    host, user = active_target()
    return {"jetson": {"host": host, "user": user}, "raw": load_cfg()}


@app.post("/settings/jetson")
def set_jetson(jetson: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    host = (jetson or {}).get("host")
    user = (jetson or {}).get("user", "jetson")
    if not host:
        return {"ok": False, "error": "host required"}
    set_target(host, user)
    return {"ok": True, "jetson": {"host": host, "user": user}}


@app.get("/connect/test")
def connect_test() -> Dict[str, Any]:
    """Attempt to gather telemetry from the Pi and Jetson."""
    try:
        pi = telemetry.collect_local()
        jetson = telemetry.collect_remote()
        ok = all(not str(value).startswith("error") for value in jetson.values())
        return {"ok": ok, "pi": pi, "jetson": jetson}
    except Exception as exc:  # pragma: no cover - defensive
        return {"ok": False, "error": str(exc)}


@app.post("/connect/install-key")
def install_key() -> Dict[str, Any]:
    """Generate an SSH key for the `pi` user and copy it to the Jetson target."""
    host, user = active_target()
    home = pathlib.Path("/home/pi")
    ssh_dir = home / ".ssh"
    ssh_dir.mkdir(parents=True, exist_ok=True)
    key_path = ssh_dir / "id_rsa"

    if not key_path.exists():
        subprocess.run(
            [
                "sudo",
                "-u",
                "pi",
                "ssh-keygen",
                "-t",
                "rsa",
                "-N",
                "",
                "-f",
                str(key_path),
            ],
            check=True,
        )

    result = subprocess.call(
        [
            "sudo",
            "-u",
            "pi",
            "ssh-copy-id",
            "-i",
            f"{key_path}.pub",
            f"{user}@{host}",
        ]
    )
    note = (
        "If this returned false, run ssh-copy-id manually in a shell to enter the password."
    )
    return {"ok": result == 0, "note": note}


@app.get("/telemetry/local")
def telemetry_local() -> Dict[str, Any]:
    """Expose local telemetry for the dashboard."""
    return telemetry.collect_local()


@app.get("/telemetry/remote")
def telemetry_remote(host: str | None = None, user: str | None = None) -> Dict[str, Any]:
    """Expose remote telemetry, allowing overrides via query parameters."""
    return telemetry.collect_remote(host=host, user=user)


@app.post("/jobs/run")
def run_job(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """Execute a remote command on the Jetson target."""
    command = payload.get("command")
    host = payload.get("host")
    user = payload.get("user")
    if not command:
        return {"ok": False, "error": "command required"}
    result = jobs.run_remote(command, host=host, user=user)
    return {
        "ok": result.returncode == 0,
        "stdout": (result.stdout or "").strip(),
        "stderr": (result.stderr or "").strip(),
    }


@app.get("/flash/probe")
def flash_probe(host: str | None = None, user: str | None = None) -> Dict[str, Any]:
    """Call the flash probe helper."""
    return flash.probe(host=host, user=user)


__all__ = ["app"]
