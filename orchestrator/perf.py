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
