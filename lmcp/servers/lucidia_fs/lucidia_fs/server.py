"""Filesystem MCP server for Lucidia.

Provides tools to read and write files within an allow-listed root
directory. Traversal outside the root is rejected. The server may be
placed in read-only mode via the ``LUCIDIA_FS_READ_ONLY`` environment
variable.
"""
from __future__ import annotations

import os
import pathlib

try:
    from mcp.server import Server as MCPServer
except Exception:  # pragma: no cover - mcp is an optional dependency
    MCPServer = None

ROOT = pathlib.Path(os.environ.get("LUCIDIA_FS_ROOT", ".")).resolve()
READ_ONLY = os.environ.get("LUCIDIA_FS_READ_ONLY", "0") == "1"

server = MCPServer("lucidia-fs") if MCPServer else None


def _resolve_path(path: str) -> pathlib.Path:
    """Return ``path`` resolved against :data:`ROOT`.

    Raises
    ------
    ValueError
        If ``path`` escapes :data:`ROOT`.
    """
    target = (ROOT / path).resolve()
    if not str(target).startswith(str(ROOT)):
        raise ValueError("path escapes root")
    return target


if server:

    @server.tool()
    def read_file(path: str) -> str:
        """Read a file relative to the allowed root."""
        return _resolve_path(path).read_text()

    @server.tool()
    def write_file(path: str, content: str) -> str:
        """Write ``content`` to ``path`` if the server is not read-only."""
        if READ_ONLY:
            raise PermissionError("server in read-only mode")
        target = _resolve_path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)
        return "ok"

    @server.tool()
    def apply_patch(path: str, diff: str) -> str:
        """Apply a unified diff to ``path``.

        This implementation is a placeholder and does not yet apply the
        patch. It simply raises ``NotImplementedError``.
        """
        raise NotImplementedError("patch application not yet implemented")


def main() -> None:
    if not server:
        raise RuntimeError("mcp package not installed")
    server.run()


if __name__ == "__main__":  # pragma: no cover - manual invocation
    main()
