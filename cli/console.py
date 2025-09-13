import argparse
import sys
import subprocess
from pathlib import Path
from datetime import date
import json

from version import __version__


# helpers

def _git_hash():
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
    except Exception:
        return None


def command_version_show(args: argparse.Namespace) -> None:
    print(__version__)
    g = _git_hash()
    if g:
        print(g)


def _bump_version(version: str, part: str) -> str:
    major, minor, patch = [int(x) for x in version.split(".")]
    if part == "major":
        major += 1
        minor = 0
        patch = 0
    elif part == "minor":
        minor += 1
        patch = 0
    else:
        patch += 1
    return f"{major}.{minor}.{patch}"


def command_version_bump(args: argparse.Namespace) -> None:
    root = Path(args.path)
    version_file = root / "version.py"
    changelog_file = root / "CHANGELOG.md"

    # read current version
    data = version_file.read_text().strip()
    current = data.split("=")[-1].strip().strip('"')
    new_version = _bump_version(current, args.part)
    version_file.write_text(f"__version__ = \"{new_version}\"\n")

    # update changelog
    today = date.today().isoformat()
    stub = f"## [{new_version}] - {today}\n\n### Features\n- TBD\n\n"
    if changelog_file.exists():
        content = changelog_file.read_text()
        lines = content.splitlines()
        if lines and lines[0].startswith("#"):
            new_content = lines[0] + "\n\n" + stub + "\n" + "\n".join(lines[1:])
        else:
            new_content = stub + content
    else:
        new_content = "# Changelog\n\n" + stub
    changelog_file.write_text(new_content)
    print(new_version)


def command_release_notes(args: argparse.Namespace) -> None:
    from scripts.release_notes import generate

    dist = Path("dist")
    dist.mkdir(exist_ok=True)
    generate(args.version, dist, Path(args.notes))


def command_preflight(args: argparse.Namespace) -> None:
    from scripts.preflight import run_checks

    ok = run_checks()
    sys.exit(0 if ok else 1)


def command_bot_list(args: argparse.Namespace) -> None:
    print("treasury")
    print("revops")
    print("sre")


def command_task_create(args: argparse.Namespace) -> None:
    print(f"task {args.name} routed")


def command_scenario_run(args: argparse.Namespace) -> None:
    print(f"scenario {args.name} executed")


def command_docs_build(args: argparse.Namespace) -> None:
    print("docs built")


def command_program_roadmap(args: argparse.Namespace) -> None:
    print("- Q1: setup\n- Q2: scale")


COMMANDS = {
    "version:show": command_version_show,
    "version:bump": command_version_bump,
    "release:notes": command_release_notes,
    "preflight:check": command_preflight,
    "bot:list": command_bot_list,
    "task:create": command_task_create,
    "scenario:run": command_scenario_run,
    "docs:build": command_docs_build,
    "program:roadmap": command_program_roadmap,
}


def main(argv=None):
    argv = argv or sys.argv[1:]
    if not argv:
        print("available commands:")
        for c in sorted(COMMANDS):
            print(f"  {c}")
        return 0
    cmd = argv[0]
    if cmd not in COMMANDS:
        print(f"unknown command: {cmd}")
        return 1

    parser = argparse.ArgumentParser(prog=f"cli.console {cmd}")
    if cmd == "version:bump":
        parser.add_argument("--part", choices=["major", "minor", "patch"], required=True)
        parser.add_argument("--path", default=".")
    elif cmd == "release:notes":
        parser.add_argument("--version", required=True)
        parser.add_argument("--notes", default="scripts/notes.yml")
    elif cmd == "task:create":
        parser.add_argument("--name", required=True)
    elif cmd == "scenario:run":
        parser.add_argument("--name", required=True)

    args = parser.parse_args(argv[1:])
    COMMANDS[cmd](args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
