import argparse
import json
from pathlib import Path

from samples import gen as sample_gen

COOKBOOK_DIR = Path("cookbook/tasks")
ARTIFACT_DIR = Path("artifacts/cookbook")


def _list_cookbook():
    return [p.stem for p in COOKBOOK_DIR.glob("*.md")]


def cmd_samples(args):
    sample_gen.main(args.overwrite)
    print("samples generated at", sample_gen.GENERATED_DIR)


def cmd_bot(args):
    print(f"running bot {args.bot} for goal '{args.goal}'")


def _parse_context(text: str) -> dict:
    import re

    match = re.search(r"```json\n(.*?)\n```", text, re.S)
    if match:
        return json.loads(match.group(1))
    return {}


def cmd_cookbook(args):
    slug = args.name
    path = COOKBOOK_DIR / f"{slug}.md"
    if not path.exists():
        print("unknown cookbook name", slug)
        print("available:", ", ".join(_list_cookbook()))
        return
    text = path.read_text()
    context = _parse_context(text)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = ARTIFACT_DIR / f"{slug}.json"
    with out_path.open("w") as f:
        json.dump({"goal": slug, "context": context}, f, indent=2)
    print(out_path)


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd")

    p_samples = sub.add_parser("samples:gen")
    p_samples.add_argument("--overwrite", action="store_true")
    p_samples.set_defaults(func=cmd_samples)

    p_bot = sub.add_parser("bot:run")
    p_bot.add_argument("--bot", required=True)
    p_bot.add_argument("--goal", required=True)
    p_bot.set_defaults(func=cmd_bot)

    p_cb = sub.add_parser("cookbook:run")
    p_cb.add_argument("--name")
    p_cb.set_defaults(func=cmd_cookbook)

    args = parser.parse_args()
    if hasattr(args, "func"):
        args.func(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
