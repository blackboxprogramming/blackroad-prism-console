#!/usr/bin/env python3
"""BlackRoad OS shell for navigating experiments."""

from __future__ import annotations

import argparse
import json
import shlex
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional

SYSTEM_ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = SYSTEM_ROOT / "manifest.json"
LOG_PATH = SYSTEM_ROOT / "logs" / "journal.log"


@dataclass
class Experiment:
    name: str
    title: str
    state: str
    path: Path
    summary: str
    run: Optional[str]

    @classmethod
    def from_dict(cls, data: Dict[str, str]) -> "Experiment":
        return cls(
            name=data["name"],
            title=data["title"],
            state=data["state"],
            path=SYSTEM_ROOT / data["path"],
            summary=data.get("summary", ""),
            run=data.get("run"),
        )


class LucidiaShell:
    def __init__(self, experiments: Iterable[Experiment]):
        catalog = list(experiments)
        self.catalog: List[Experiment] = catalog
        self.experiments: Dict[str, Experiment] = {exp.name: exp for exp in catalog}
        for exp in catalog:
            self.experiments.setdefault(exp.path.as_posix(), exp)
            self.experiments.setdefault(exp.path.relative_to(SYSTEM_ROOT).as_posix(), exp)

    def run(self, interactive: bool, command: Optional[List[str]]) -> int:
        if interactive:
            return self._run_interactive()
        if not command:
            print("No command provided", file=sys.stderr)
            return 1
        return self._execute(command)

    def _run_interactive(self) -> int:
        print("Booting BlackRoad OS shell. Type 'help' for commands. Press Ctrl+D to exit.")
        while True:
            try:
                raw = input("lucidia> ").strip()
            except EOFError:
                print()
                break
            if not raw:
                continue
            command = shlex.split(raw)
            status = self._execute(command)
            if status != 0:
                print(f"Command exited with status {status}")
        return 0

    def _execute(self, command: List[str]) -> int:
        cmd = command[0]
        args = command[1:]
        if cmd == "help":
            self._print_help()
            return 0
        if cmd == "list":
            self._list_experiments()
            append_log("list")
            return 0
        if cmd == "open":
            if not args:
                print("Usage: open <experiment>")
                return 1
            return self._open(args[0])
        if cmd == "run":
            if not args:
                print("Usage: run <experiment>")
                return 1
            return self._run_experiment(args[0])
        if cmd == "info":
            if not args:
                print("Usage: info <experiment>")
                return 1
            return self._info(args[0])
        if cmd == "logs":
            print(LOG_PATH.read_text(encoding="utf-8") if LOG_PATH.exists() else "<no logs yet>")
            append_log("logs")
            return 0
        if cmd in {"exit", "quit"}:
            raise SystemExit(0)
        print(f"Unknown command: {cmd}")
        return 1

    def _resolve(self, key: str) -> Optional[Experiment]:
        if key in self.experiments:
            return self.experiments[key]
        normalized = key.strip("/")
        return self.experiments.get(normalized)

    def _list_experiments(self) -> None:
        header = f"{'Name':<18} {'State':<10} Path"
        print(header)
        print("-" * len(header))
        seen: set[str] = set()
        for exp in self.catalog:
            if exp.name in seen:
                continue
            seen.add(exp.name)
            rel_path = exp.path.relative_to(SYSTEM_ROOT)
            print(f"{exp.title:<18} {exp.state:<10} {rel_path}")

    def _print_help(self) -> None:
        print(
            "Commands:\n"
            "  list                  List available experiments\n"
            "  open <experiment>     Show the README for an experiment\n"
            "  run <experiment>      Execute the experiment's run command\n"
            "  info <experiment>     Display metadata for an experiment\n"
            "  logs                  Show the activity log\n"
            "  help                  Show this message\n"
            "  exit / quit           Leave the shell"
        )

    def _open(self, key: str) -> int:
        exp = self._resolve(key)
        if not exp:
            print(f"Experiment '{key}' not found")
            return 1
        readme = exp.path / "README.md"
        if not readme.exists():
            print(f"No README found at {readme}")
            append_log("open", exp.name, "missing README")
            return 1
        print(readme.read_text(encoding="utf-8"))
        append_log("open", exp.name)
        return 0

    def _run_experiment(self, key: str) -> int:
        exp = self._resolve(key)
        if not exp:
            print(f"Experiment '{key}' not found")
            return 1
        if not exp.run:
            print(f"Experiment '{exp.title}' has no run command defined")
            append_log("run", exp.name, "no command")
            return 1
        print(f"Running {exp.title} -> {exp.run}")
        result = subprocess.run(exp.run, shell=True)
        append_log("run", exp.name, f"status={result.returncode}")
        return result.returncode

    def _info(self, key: str) -> int:
        exp = self._resolve(key)
        if not exp:
            print(f"Experiment '{key}' not found")
            return 1
        rel_path = exp.path.relative_to(SYSTEM_ROOT)
        print(f"{exp.title}\n  State: {exp.state}\n  Path: {rel_path}\n  Summary: {exp.summary}")
        append_log("info", exp.name)
        return 0


def append_log(action: str, experiment: Optional[str] = None, details: Optional[str] = None) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).isoformat()
    parts = [timestamp, action]
    if experiment:
        parts.append(experiment)
    if details:
        parts.append(details)
    line = " | ".join(parts)
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def load_experiments() -> List[Experiment]:
    if not MANIFEST_PATH.exists():
        raise SystemExit(f"Manifest not found at {MANIFEST_PATH}")
    data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return [Experiment.from_dict(item) for item in data]


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="BlackRoad OS command shell")
    parser.add_argument("command", nargs=argparse.REMAINDER, help="Optional command to run non-interactively")
    parser.add_argument("-c", "--command", dest="single_command", nargs=argparse.REMAINDER, help=argparse.SUPPRESS)
    parser.add_argument("-n", "--non-interactive", action="store_true", help="Run a single command and exit")
    args = parser.parse_args(argv)
    if args.single_command:
        args.command = args.single_command
        args.non_interactive = True
    return args


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    experiments = load_experiments()
    shell = LucidiaShell(experiments)
    if args.non_interactive:
        return shell.run(False, args.command)
    if args.command:
        return shell.run(False, args.command)
    return shell.run(True, None)


if __name__ == "__main__":
    sys.exit(main())
