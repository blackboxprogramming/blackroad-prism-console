"""Convenience CLI for triggering Pi-Holo camera captures from macOS."""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from typing import Any, Dict

DEFAULT_HOST = "pi-holo.local"
DEFAULT_PORT = 8787


class TriggerError(RuntimeError):
    """Raised when a trigger request fails."""


def _post(host: str, port: int, path: str, payload: Dict[str, Any], timeout: float) -> Dict[str, Any]:
    url = f"http://{host}:{port}{path}"
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:  # pragma: no cover - network edge
        raise TriggerError(f"HTTP {exc.code} when calling {url}: {exc.reason}") from exc
    except urllib.error.URLError as exc:  # pragma: no cover - network edge
        raise TriggerError(f"Failed to reach {url}: {exc.reason}") from exc


def _handle_snap(args: argparse.Namespace) -> Dict[str, Any]:
    return _post(args.host, args.port, "/snap", {}, args.timeout)


def _handle_stream(args: argparse.Namespace) -> Dict[str, Any]:
    payload = {"duration_ms": args.duration_ms, "fps": args.fps}
    return _post(args.host, args.port, "/stream", payload, args.timeout)


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Trigger Pi-Holo camera captures")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Renderer host (default: pi-holo.local)")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Renderer HTTP port (default: 8787)")
    parser.add_argument("--timeout", type=float, default=10.0, help="HTTP timeout in seconds")

    subparsers = parser.add_subparsers(dest="command", required=True)

    snap_parser = subparsers.add_parser("snap", help="Trigger a single frame capture")
    snap_parser.set_defaults(func=_handle_snap)

    stream_parser = subparsers.add_parser("stream", help="Trigger a streaming session")
    stream_parser.add_argument("duration_ms", type=int, help="Stream duration in milliseconds")
    stream_parser.add_argument("fps", type=float, help="Stream frame rate")
    stream_parser.set_defaults(func=_handle_stream)

    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    handler = getattr(args, "func", None)
    if handler is None:  # pragma: no cover - argparse guard
        raise SystemExit("No command provided")

    try:
        response = handler(args)
    except TriggerError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    if response:
        print(json.dumps(response, indent=2, sort_keys=True))
    else:  # pragma: no cover - unexpected empty response
        print("ok")
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    sys.exit(main(sys.argv[1:]))
