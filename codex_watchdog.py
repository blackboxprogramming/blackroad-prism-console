"""
Codex Watchdog — Prism Console
Continuously monitors /codex_prompts/prompts for new or changed YAML files.
On change: run dispatcher → update memory graph → log summary.
"""

from __future__ import annotations

import datetime
import hashlib
import json
import os
import time
from typing import Dict, List

from lucidia_mathlab.memory_graph import MathMemoryGraph
from codex_prompts.dispatch_codex import run_codex_prompt

PROMPT_DIR = "codex_prompts/prompts"
CHECK_INTERVAL = 30  # seconds
HASH_STORE = "codex_logs/.watchdog_hashes.json"


def file_hash(path: str) -> str:
    """Compute SHA256 hash of a file."""
    with open(path, "rb") as handle:
        return hashlib.sha256(handle.read()).hexdigest()


def load_hashes() -> Dict[str, str]:
    if os.path.exists(HASH_STORE):
        with open(HASH_STORE, "r", encoding="utf-8") as handle:
            return json.load(handle)
    return {}


def save_hashes(hashes: Dict[str, str]) -> None:
    os.makedirs(os.path.dirname(HASH_STORE), exist_ok=True)
    with open(HASH_STORE, "w", encoding="utf-8") as handle:
        json.dump(hashes, handle, indent=2)


def list_prompt_files() -> List[str]:
    if not os.path.isdir(PROMPT_DIR):
        return []

    return [
        os.path.join(PROMPT_DIR, name)
        for name in os.listdir(PROMPT_DIR)
        if name.endswith(".yaml")
    ]


def run_cycle() -> None:
    hashes = load_hashes()
    new_hashes: Dict[str, str] = {}
    changes: List[str] = []

    for path in sorted(list_prompt_files()):
        filename = os.path.basename(path)
        digest = file_hash(path)
        new_hashes[filename] = digest
        if hashes.get(filename) != digest:
            changes.append(path)

    if changes:
        print(f"\n[{datetime.datetime.now()}] Detected updates → {[os.path.basename(c) for c in changes]}")
        for path in changes:
            run_codex_prompt(path)

        graph = MathMemoryGraph()
        graph.load_logs()
        graph.render()

        print("[✓] Memory graph updated.\n")

    save_hashes(new_hashes)



def main() -> None:
    print(f"[Codex Watchdog] Monitoring {PROMPT_DIR} every {CHECK_INTERVAL}s…")
    while True:
        try:
            run_cycle()
            time.sleep(CHECK_INTERVAL)
        except KeyboardInterrupt:
            print("\n[Stopped by user]")
            break
        except Exception as exc:  # pylint: disable=broad-except
            print(f"[⚠] Watchdog error: {exc}")
            time.sleep(10)


if __name__ == "__main__":
    main()
