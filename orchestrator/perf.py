from __future__ import annotations

import contextlib
import os
import time
from typing import Dict, Generator, Optional

PAGE_SIZE = os.sysconf("SC_PAGE_SIZE") if hasattr(os, "sysconf") else 4096


def _rss_mb() -> Optional[int]:
    """Best-effort RSS in megabytes using /proc/self/statm."""
    try:
        with open("/proc/self/statm", "r", encoding="utf-8") as fh:
            parts = fh.read().split()
        pages = int(parts[1])
        return int(pages * PAGE_SIZE / (1024 * 1024))
    except Exception:
        return None


@contextlib.contextmanager
def perf_timer(label: str) -> Generator[Dict[str, Optional[int]], None, None]:
    """Measure elapsed ms and rss at context exit."""
    start = time.monotonic()
    data: Dict[str, Optional[int]] = {}
    try:
        yield data
    finally:
        end = time.monotonic()
        data["elapsed_ms"] = int((end - start) * 1000)
        data["rss_mb"] = _rss_mb()
