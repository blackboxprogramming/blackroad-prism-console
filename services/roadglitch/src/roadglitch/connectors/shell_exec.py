from __future__ import annotations

import asyncio
import shlex
from typing import Any, Dict

from ..config import get_settings


class ShellConnector:
    name = "connector.shell.exec"

    async def execute(self, *, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        settings = get_settings()
        if not settings.allow_shell:
            raise PermissionError("Shell connector disabled")
        command = params.get("command")
        if not command:
            raise ValueError("command required")
        process = await asyncio.create_subprocess_exec(
            *shlex.split(command), stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        return {
            "returncode": process.returncode,
            "stdout": stdout.decode(),
            "stderr": stderr.decode(),
        }


__all__ = ["ShellConnector"]

