import json
import os
import random
import time
from pathlib import Path
from typing import Union

from orchestrator.flags import get_flag
from orchestrator.tenancy import ns_path


def _apply_chaos() -> None:
    delay = int(get_flag("chaos.storage.delay_ms", 0) or 0)
    if delay > 0:
        time.sleep(delay / 1000)
    rate = float(get_flag("chaos.storage.error_rate", 0) or 0)
    if rate > 0 and random.random() < rate:
        raise IOError("Injected storage error")


def _rewrite(path: str) -> str:
    tenant = os.getenv("PRISM_TENANT")
    return ns_path(tenant, path)


def write(path: str, content: Union[dict, str]) -> None:
    path = _rewrite(path)
    _apply_chaos()
    p = Path(path)
    os.makedirs(p.parent, exist_ok=True)
    mode = "a" if p.suffix == ".jsonl" else "w"
    text = json.dumps(content) if isinstance(content, dict) else str(content)
    with open(p, mode, encoding="utf-8") as fh:
        if mode == "a":
            fh.write(text + "\n")
        else:
            fh.write(text)


def read(path: str) -> str:
    path = _rewrite(path)
    _apply_chaos()
    p = Path(path)
    try:
        with open(p, "r", encoding="utf-8") as fh:
            return fh.read()
    except FileNotFoundError:
        return ""
