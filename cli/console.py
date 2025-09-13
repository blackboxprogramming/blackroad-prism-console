import argparse
import json
import sys
import uuid

from sdk import plugin_api
from orchestrator import health
from workflows import dsl
from i18n.translate import t
from docs.generate_bot_docs import discover_bots
from tui import app as tui_app


def cmd_health(args):
    result = health.check()
    print(json.dumps(result))
    return 0 if result["overall_status"] == "ok" else 1


def cmd_wf_run(args):
    wf_id = str(uuid.uuid4())
    out = dsl.run_workflow(args.file)
    summary = "\n".join(
        s.get("summary", s.get("content", "")) for s in out["steps"] if isinstance(s, dict)
    )
    dsl.write_summary(wf_id, summary)
    return 0


def cmd_bot_list(args):
    plugin_api.get_settings().LANG = args.lang
    lang = args.lang
    bots = discover_bots().keys()
    header = t("bot_list_header", lang=lang)
    print(header)
    if not bots:
        print(t("no_bots", lang=lang))
    else:
        for b in bots:
            print("-", b)
    return 0


def cmd_tui_run(args):
    plugin_api.get_settings().THEME = args.theme
    tui_app.run(args.theme)
    return 0


COMMANDS = {
    "health:check": cmd_health,
    "wf:run": cmd_wf_run,
    "bot:list": cmd_bot_list,
    "tui:run": cmd_tui_run,
}


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("command")
    parser.add_argument("--file")
    parser.add_argument("--lang", default="en")
    parser.add_argument("--theme", default="light")
    args = parser.parse_args(argv)
    func = COMMANDS.get(args.command)
    if not func:
        print("unknown command")
        return 1
    return func(args)


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
