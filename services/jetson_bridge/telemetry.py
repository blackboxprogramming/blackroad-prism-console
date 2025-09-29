"""Collect telemetry from the Jetson host via SSH."""

from __future__ import annotations

import re
import subprocess
from statistics import mean
from typing import Callable, Dict, Mapping, MutableMapping, Sequence

from .config import resolve_target

SSHRunner = Callable[[Sequence[str]], subprocess.CompletedProcess[str]]


def _default_runner(cmd: Sequence[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(  # type: ignore[arg-type]
        cmd,
        capture_output=True,
        text=True,
        timeout=15,
        check=False,
    )


def _parse_tegrastats(output: str) -> Dict[str, float]:
    data: MutableMapping[str, float] = {}

    ram_match = re.search(r"RAM\s+(?P<used>\d+)/(?:\d+)MB", output)
    total_match = re.search(r"RAM\s+\d+/(?P<total>\d+)MB", output)
    if ram_match:
        data["ram_used_mb"] = float(ram_match.group("used"))
    if total_match:
        data["ram_total_mb"] = float(total_match.group("total"))

    cpu_samples = [float(v) for v in re.findall(r"CPU\s*\[[^\]]*?(\d+)%@", output)]
    if cpu_samples:
        data["cpu_percent"] = mean(cpu_samples)

    gpu_match = re.search(r"GPU\s*(\d+)%", output)
    if gpu_match:
        data["gpu_percent"] = float(gpu_match.group(1))

    temp_cpu = re.search(r"Tcpu@(?P<temp>\d+)C", output)
    if temp_cpu:
        data["temp_cpu_c"] = float(temp_cpu.group("temp"))

    temp_gpu = re.search(r"Tgpu@(?P<temp>\d+)C", output)
    if temp_gpu:
        data["temp_gpu_c"] = float(temp_gpu.group("temp"))

    return dict(data)


def collect(host: str | None = None, user: str | None = None, runner: SSHRunner | None = None) -> Mapping[str, object]:
    """Return a telemetry snapshot from ``tegrastats``.

    Parameters
    ----------
    host, user:
        Optional overrides for the Jetson SSH target. When omitted the
        ``JETSON_HOST`` and ``JETSON_USER`` environment variables are
        consulted, falling back to ``jetson.local`` / ``jetson``.
    runner:
        Optional callable used to execute the SSH command. This makes the
        module testable without opening a network connection.
    """

    resolved_host, resolved_user = resolve_target(host, user)
    runner = runner or _default_runner

    cmd = [
        "ssh",
        f"{resolved_user}@{resolved_host}",
        "LANG=C tegrastats --interval 1000 --count 1",
    ]
    result = runner(cmd)
    output = result.stdout.strip() or result.stderr.strip()

    if result.returncode != 0:
        return {
            "ok": False,
            "host": resolved_host,
            "user": resolved_user,
            "error": output or "tegrastats failed",
        }

    metrics = _parse_tegrastats(output)
    return {
        "ok": True,
        "host": resolved_host,
        "user": resolved_user,
        "raw": output,
        "metrics": metrics,
    }


__all__ = ["collect"]
