

from __future__ import annotations
from pathlib import Path
from time import sleep

def tail_memory(path: str):
    p = Path(path)
    last_size = 0
    while True:
        if p.exists():
            sz = p.stat().st_size
            if sz > last_size:
                data = p.read_text(encoding="utf-8")[-2000:]
                print("\n[Roadie] memory pulse:\n" + data)
                last_size = sz
        sleep(2)

if __name__ == "__main__":
    import sys
    tail_memory(sys.argv[1] if len(sys.argv) > 1 else "logs/prayer.log")

