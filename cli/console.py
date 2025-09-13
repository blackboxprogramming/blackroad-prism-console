"""Lightweight CLI for program and task management."""

from __future__ import annotations

import argparse
import importlib.util
from datetime import datetime
from pathlib import Path
from typing import List

from bots import BOT_REGISTRY
from orchestrator import Task, load_tasks, save_tasks
from orchestrator.scheduler import schedule_poll
from program import ProgramBoard, ProgramItem

_spec = importlib.util.spec_from_file_location(
    "csv_io", Path(__file__).resolve().parent.parent / "io" / "csv_io.py"
)
assert _spec and _spec.loader
_csv_io = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_csv_io)
export_tasks = _csv_io.export_tasks
import_tasks = _csv_io.import_tasks


def _parse_ids(value: str | None) -> List[str]:
    if not value:
        return []
    return [v.strip() for v in value.split(",") if v.strip()]


def cmd_program_add(argv: List[str]) -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--id", required=True)
    p.add_argument("--title", required=True)
    p.add_argument("--owner", required=True)
    p.add_argument("--bot", required=True)
    p.add_argument("--start")
    p.add_argument("--due")
    args = p.parse_args(argv)

    item = ProgramItem(
        id=args.id,
        title=args.title,
        owner=args.owner,
        bot=args.bot,
        start=datetime.fromisoformat(args.start).date() if args.start else None,
        due=datetime.fromisoformat(args.due).date() if args.due else None,
        depends_on=[],
    )
    board = ProgramBoard()
    board.add(item)


def cmd_program_update(argv: List[str]) -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--id", required=True)
    p.add_argument("--status")
    p.add_argument("--depends_on")
    args = p.parse_args(argv)
    fields = {}
    if args.status:
        fields["status"] = args.status
    if args.depends_on:
        fields["depends_on"] = _parse_ids(args.depends_on)
    board = ProgramBoard()
    board.update(args.id, **fields)


def cmd_program_list(argv: List[str]) -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--status")
    args = p.parse_args(argv)
    board = ProgramBoard()
    items = board.list(args.status)
    for item in items:
        print(f"{item.id}: {item.title} [{item.status}]")


def cmd_program_roadmap(argv: List[str]) -> None:
    board = ProgramBoard()
    print(board.as_markdown_roadmap())


def cmd_task_create(argv: List[str]) -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--id", required=True)
    p.add_argument("--goal", required=True)
    p.add_argument("--bot", required=True)
    p.add_argument("--depends-on")
    p.add_argument("--at")
    args = p.parse_args(argv)

    task = Task(
        id=args.id,
        goal=args.goal,
        bot=args.bot,
        depends_on=_parse_ids(args.depends_on),
        scheduled_for=datetime.fromisoformat(args.at) if args.at else None,
    )
    tasks = load_tasks()
    tasks.append(task)
    save_tasks(tasks)


def cmd_task_import(argv: List[str]) -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--csv", required=True)
    args = p.parse_args(argv)
    tasks = load_tasks()
    new_tasks = import_tasks(args.csv)
    tasks.extend(new_tasks)
    save_tasks(tasks)

    board = ProgramBoard()
    for t in new_tasks:
        board.add(
            ProgramItem(
                id=t.id,
                title=t.goal,
                owner="import",
                bot=t.bot,
                status="planned",
                depends_on=t.depends_on,
            )
        )


def cmd_task_export(argv: List[str]) -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--csv", required=True)
    args = p.parse_args(argv)
    export_tasks(args.csv, load_tasks())


def cmd_bot_run(argv: List[str]) -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--bot", required=True)
    p.add_argument("--goal", required=True)
    args = p.parse_args(argv)
    bot = BOT_REGISTRY[args.bot]
    task = Task(id="manual", goal=args.goal, bot=args.bot)
    result = bot.run(task)
    print(result)


def cmd_scheduler_run(argv: List[str]) -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--every-seconds", type=int, default=0)
    p.parse_args(argv)
    schedule_poll(datetime.utcnow())


COMMANDS = {
    "program:add": cmd_program_add,
    "program:update": cmd_program_update,
    "program:list": cmd_program_list,
    "program:roadmap": cmd_program_roadmap,
    "task:create": cmd_task_create,
    "task:import": cmd_task_import,
    "task:export": cmd_task_export,
    "bot:run": cmd_bot_run,
    "scheduler:run": cmd_scheduler_run,
}


def main(argv: List[str] | None = None) -> None:
    import sys

    argv = list(sys.argv[1:] if argv is None else argv)
    if not argv:
        return
    cmd = argv[0]
    handler = COMMANDS.get(cmd)
    if handler is None:
        raise SystemExit(f"unknown command: {cmd}")
    handler(argv[1:])


if __name__ == "__main__":  # pragma: no cover - CLI entry
    main()

