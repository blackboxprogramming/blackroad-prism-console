"""Async daemon that periodically records telemetry from the Pi and Jetson hosts."""

from __future__ import annotations

import asyncio
import datetime
from pathlib import Path
from typing import Any, Callable, Dict

from agent import telemetry

LOGFILE = Path("/var/log/blackroad-agent.log")
JETSON_HOST = "jetson.local"
JETSON_USER = "jetson"


def _safe_collect(func: Callable[[], Dict[str, Any]]) -> Dict[str, Any]:
    try:
        return func()
    except Exception as exc:  # pragma: no cover - defensive guard
        return {"error": str(exc)}


async def loop(interval: int = 60) -> None:
    """Main telemetry loop writing Pi and Jetson stats to the logfile."""
    while True:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()

        pi_stats = _safe_collect(telemetry.collect_local)
        jetson_stats = _safe_collect(lambda: telemetry.collect_remote(JETSON_HOST, user=JETSON_USER))

        line = f"[{now}] PI: {pi_stats} | JETSON: {jetson_stats}\n"

        try:
            LOGFILE.parent.mkdir(parents=True, exist_ok=True)
            with LOGFILE.open("a", encoding="utf-8") as handle:
                handle.write(line)
        except OSError:
            # Fall back to stdout if the log cannot be written
            print(line, end="")

        await asyncio.sleep(interval)


def main() -> None:
    """Entrypoint for the console script."""
    asyncio.run(loop())


if __name__ == "__main__":
    main()
