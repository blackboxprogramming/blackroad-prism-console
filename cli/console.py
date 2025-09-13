from __future__ import annotations

import argparse
import json
from pathlib import Path

from orchestrator.orchestrator import create_task, route_task
from orchestrator.registry import list as list_bots


def _cmd_list(_: argparse.Namespace) -> None:
    for bot in list_bots():
        intents = ", ".join(bot.SUPPORTED_TASKS)
        print(f"{bot.NAME}\t{bot.MISSION}\t{intents}")


def _cmd_run(args: argparse.Namespace) -> None:
    context = {}
    if args.context:
        context = json.loads(Path(args.context).read_text())
    task = create_task(goal=args.goal, context=context)
    resp = route_task(task, args.bot)
    print(resp.summary)


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command")

    p_list = sub.add_parser("bot:list")
    p_list.set_defaults(func=_cmd_list)

    p_run = sub.add_parser("bot:run")
    p_run.add_argument("--bot", required=True)
    p_run.add_argument("--goal", required=True)
    p_run.add_argument("--context")
    p_run.set_defaults(func=_cmd_run)

    args = parser.parse_args()
    if not hasattr(args, "func"):
        parser.print_help()
        return
    args.func(args)


if __name__ == "__main__":
    main()
