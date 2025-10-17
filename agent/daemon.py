"""System service entrypoint for the BlackRoad agent."""

from __future__ import annotations

import asyncio
import datetime as dt
import logging
import os
from pathlib import Path
from typing import Any, Callable

from agent import telemetry

LOGFILE = Path(os.environ.get("BLACKROAD_AGENT_LOG", "/var/log/blackroad-agent.log"))
JETSON_HOST = os.environ.get("BLACKROAD_JETSON_HOST", "jetson.local")
JETSON_USER = os.environ.get("BLACKROAD_JETSON_USER", "jetson")


def _safe_call(func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
    try:
        return func(*args, **kwargs)
    except Exception as exc:  # pragma: no cover - defensive guard
        logging.exception("Telemetry probe failed: %s", func.__name__)
        return {"error": str(exc), "probe": func.__name__}


def _write_line(line: str) -> None:
    try:
        LOGFILE.parent.mkdir(parents=True, exist_ok=True)
    except OSError:
        # Parent may already exist or be protected; ignore creation failure.
        pass

    try:
        with LOGFILE.open("a", encoding="utf-8") as handle:
            handle.write(line)
    except PermissionError:
        logging.error("Insufficient permissions to write telemetry log: %s", LOGFILE)
    except OSError:
        logging.exception("Failed to append telemetry line to %s", LOGFILE)


async def loop(interval: int = 60) -> None:
    logging.info("Starting telemetry loop with interval=%ss", interval)
    while True:
        timestamp = dt.datetime.now(dt.timezone.utc).isoformat()
        pi_stats = _safe_call(telemetry.collect_local)
        jetson_stats = _safe_call(telemetry.collect_remote, JETSON_HOST, user=JETSON_USER)

        line = f"[{timestamp}] PI: {pi_stats} | JETSON: {jetson_stats}\n"
        _write_line(line)

        await asyncio.sleep(interval)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    asyncio.run(loop())


if __name__ == "__main__":
    main()
