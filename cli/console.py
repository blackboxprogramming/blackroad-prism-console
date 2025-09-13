from __future__ import annotations

import argparse
import json
import sys

from orchestrator import audit, approvals, tasks
from orchestrator.exceptions import BotExecutionError
from security import rbac
from security.rbac import APPROVAL_DECIDE, APPROVAL_REQUEST, TASK_CREATE, TASK_ROUTE
from tools import storage

BOTS = ["Treasury-BOT", "Change/Release-BOT", "SRE-BOT"]


def parse_user(user_id: str) -> rbac.User:
    return rbac.rbac.get_user(user_id)


def cmd_bot_list(args: argparse.Namespace, *, user: rbac.User) -> None:
    for b in BOTS:
        print(b)


@rbac.require([TASK_CREATE])
def cmd_task_create(args: argparse.Namespace, *, user: rbac.User) -> None:
    context = {}
    if args.context:
        context = storage.read_json(args.context, from_data=False)
    task = tasks.create_task(args.goal, context, user=user)
    print(task.id)


@rbac.require([TASK_ROUTE])
def cmd_task_route(args: argparse.Namespace, *, user: rbac.User) -> None:
    try:
        task = tasks.route_task(args.id, args.bot, user=user)
        print(task.status)
    except BotExecutionError as e:
        print(str(e))
        sys.exit(1)


@rbac.require([APPROVAL_REQUEST])
def cmd_approval_create(args: argparse.Namespace, *, user: rbac.User) -> None:
    req = approvals.create_approval(args.task, user.id, args.for_role)
    print(req.id)


@rbac.require([APPROVAL_DECIDE])
def cmd_approval_decide(args: argparse.Namespace, *, user: rbac.User) -> None:
    req = approvals.decide(args.id, args.decision, user.id, args.reason)
    print(req.status)


@rbac.require([APPROVAL_DECIDE])
def cmd_approval_list(args: argparse.Namespace, *, user: rbac.User) -> None:
    items = approvals.list_approvals(args.status)
    for item in items:
        print(json.dumps(item.__dict__))


@rbac.require([rbac.ADMIN])
def cmd_audit_verify(args: argparse.Namespace, *, user: rbac.User) -> None:
    bad = audit.verify_log()
    if bad:
        print("invalid signatures at lines", bad)
        sys.exit(1)
    print("all signatures valid")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd")

    def add_user(sp: argparse.ArgumentParser) -> None:
        sp.add_argument("--as-user", dest="as_user", default="U_SYS")

    sub_bot = sub.add_parser("bot:list")
    add_user(sub_bot)
    sub_bot.set_defaults(func=cmd_bot_list)

    sub_create = sub.add_parser("task:create")
    add_user(sub_create)
    sub_create.add_argument("--goal", required=True)
    sub_create.add_argument("--context")
    sub_create.set_defaults(func=cmd_task_create)

    sub_route = sub.add_parser("task:route")
    add_user(sub_route)
    sub_route.add_argument("--id", required=True)
    sub_route.add_argument("--bot", required=True)
    sub_route.set_defaults(func=cmd_task_route)

    sub_acreate = sub.add_parser("approval:create")
    add_user(sub_acreate)
    sub_acreate.add_argument("--task", required=True)
    sub_acreate.add_argument("--for-role", dest="for_role", required=True)
    sub_acreate.set_defaults(func=cmd_approval_create)

    sub_alist = sub.add_parser("approval:list")
    add_user(sub_alist)
    sub_alist.add_argument("--status")
    sub_alist.set_defaults(func=cmd_approval_list)

    sub_adecide = sub.add_parser("approval:decide")
    add_user(sub_adecide)
    sub_adecide.add_argument("--id", required=True)
    sub_adecide.add_argument("--decision", required=True)
    sub_adecide.add_argument("--reason")
    sub_adecide.set_defaults(func=cmd_approval_decide)

    sub_verify = sub.add_parser("audit:verify")
    add_user(sub_verify)
    sub_verify.set_defaults(func=cmd_audit_verify)

    return p


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    user = parse_user(args.as_user)
    try:
        if not args.cmd:
            parser.print_help()
            return 0
        args.func(args, user=user)
        return 0
    except rbac.PermissionError as e:
        print(str(e))
        return 2


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
