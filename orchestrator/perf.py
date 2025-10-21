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
import os
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Dict, Optional


def _read_rss_mb() -> Optional[int]:
    """Read current RSS memory usage in MB if supported."""
    statm = Path("/proc/self/statm")
    try:
        with statm.open() as fh:
            rss_pages = int(fh.read().split()[1])
        page_size = os.sysconf("SC_PAGE_SIZE") // 1024  # to KB
        return rss_pages * page_size // 1024  # to MB
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
@contextmanager
def perf_timer(label: str) -> Dict[str, Optional[int]]:
    """Simple perf timer context manager.

    Usage:
        with perf_timer('step') as p:
            do_work()
        print(p['elapsed_ms'], p['rss_mb'])
    """
    start = time.monotonic()
    result: Dict[str, Optional[int]] = {}
    yield result
    end = time.monotonic()
    rss_after = _read_rss_mb()
    result["elapsed_ms"] = int((end - start) * 1000)
    result["rss_mb"] = rss_after if rss_after is not None else None
