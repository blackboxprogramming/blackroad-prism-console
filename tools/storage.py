import json
import os
from pathlib import Path
from typing import Union


def write(path: str, content: Union[dict, str]) -> None:
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
    p = Path(path)
    try:
        with open(p, "r", encoding="utf-8") as fh:
            return fh.read()
    except FileNotFoundError:
        return ""
