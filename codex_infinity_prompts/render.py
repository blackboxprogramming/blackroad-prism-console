#!/usr/bin/env python3
"""Render Codex Infinity prompt templates with CLI variables."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, Iterable, Tuple
import re

TEMPLATE_DIR = Path(__file__).resolve().parent / "templates"
TEMPLATE_MAP = {
    "general": "GENERAL.md",
    "jetson_agent": "JETSON_AGENT.md",
    "pi_holo": "PI_HOLO.md",
    "pi_ops": "PI_OPS.md",
    "pi_zero": "PI_ZERO.md",
    "arduino_uno": "ARDUINO_UNO.md",
}
PLACEHOLDER_PATTERN = re.compile(r"{{\s*([a-zA-Z0-9_]+)\s*}}")


def list_templates() -> str:
    longest = max(len(name) for name in TEMPLATE_MAP)
    lines = ["Available templates:"]
    for name, filename in sorted(TEMPLATE_MAP.items()):
        lines.append(f"  {name.ljust(longest)} -> {filename}")
    return "\n".join(lines)


def load_template(name: str) -> Tuple[Path, str]:
    try:
        filename = TEMPLATE_MAP[name]
    except KeyError as exc:
        raise SystemExit(f"Unknown template '{name}'. Use --list to inspect options.") from exc
    path = TEMPLATE_DIR / filename
    if not path.exists():
        raise SystemExit(f"Template file missing: {path}")
    return path, path.read_text(encoding="utf-8")


def extract_placeholders(content: str) -> Iterable[str]:
    return sorted(set(PLACEHOLDER_PATTERN.findall(content)))


def parse_context(pairs: Iterable[str]) -> Dict[str, str]:
    pairs = list(pairs)
    context: Dict[str, str] = {}
    i = 0
    while i < len(pairs):
        key = pairs[i]
        if not key.startswith("--"):
            raise SystemExit(f"Unexpected argument '{key}'. Did you forget to prefix it with --?")
        key = key[2:]
        if not key:
            raise SystemExit("Empty key provided. Use --name value format.")
        i += 1
        if i >= len(pairs):
            raise SystemExit(f"Missing value for --{key}.")
        value = pairs[i]
        value = value.replace("\\n", "\n")
        context[key] = value
        i += 1
    return context


def render_template(content: str, context: Dict[str, str]) -> Tuple[str, Iterable[str]]:
    missing = []

    def replace(match: re.Match[str]) -> str:
        key = match.group(1)
        if key in context:
            return context[key]
        missing.append(key)
        return match.group(0)

    rendered = PLACEHOLDER_PATTERN.sub(replace, content)
    return rendered, missing


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("template", nargs="?", choices=sorted(TEMPLATE_MAP), help="Template name to render")
    parser.add_argument("--out", type=Path, help="Optional path to write the rendered prompt")
    parser.add_argument("--list", action="store_true", help="List available templates and exit")
    parser.add_argument("--show-vars", action="store_true", help="Display placeholders before rendering")
    parser.add_argument("--strict", action="store_true", help="Exit with error when placeholders are missing")
    parser.add_argument("--dump-context", type=Path, help="Write the merged context values as JSON alongside the prompt")
    args, unknown = parser.parse_known_args(argv)

    if args.list:
        print(list_templates())
        return 0

    if not args.template:
        parser.error("template is required unless --list is set")

    context = parse_context(unknown)
    _template_path, template_text = load_template(args.template)

    if args.show_vars:
        placeholders = extract_placeholders(template_text)
        if placeholders:
            print("Placeholders:")
            for key in placeholders:
                value = context.get(key, "<unset>")
                print(f"  {key}: {value}")
        else:
            print("Template has no placeholders.")

    rendered, missing = render_template(template_text, context)
    if missing:
        unique_missing = sorted(set(missing))
        msg = (
            "Unresolved placeholders: "
            + ", ".join(f"{{{{{key}}}}}" for key in unique_missing)
            + ". Provide matching --key values."
        )
        if args.strict:
            raise SystemExit(msg)
        print(msg, file=sys.stderr)

    if args.dump_context:
        args.dump_context.parent.mkdir(parents=True, exist_ok=True)
        args.dump_context.write_text(json.dumps(context, indent=2, sort_keys=True), encoding="utf-8")

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(rendered, encoding="utf-8")
    else:
        sys.stdout.write(rendered)
        if not rendered.endswith("\n"):
            sys.stdout.write("\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
