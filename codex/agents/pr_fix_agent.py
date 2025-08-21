#!/usr/bin/env python3
"""PR Fix Agent

Runs the repository's ``fix-everything.sh`` script to resolve common pull
request errors.  If the script makes any changes, they are committed and
optionally pushed back to the PR branch.

Environment:
  GITHUB_TOKEN     Optional token for pushing fixes
  GITHUB_REPOSITORY Repo in ``owner/name`` form (required if pushing)
  GITHUB_REF_NAME   Branch to push to; defaults to current branch
"""
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIX_SCRIPT = ROOT / "fix-everything.sh"


def shell(cmd: str, **kw) -> subprocess.CompletedProcess:
    """Run *cmd* and return the completed process."""
    return subprocess.run(cmd, shell=True, check=True, text=True, **kw)


def git_dirty() -> bool:
    """Return True if the git work tree has uncommitted changes."""
    res = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
    return bool(res.stdout.strip())


def main() -> int:
    if not FIX_SCRIPT.exists():
        print("fix-everything.sh not found", file=os.sys.stderr)
        return 2
    shell(f"bash {FIX_SCRIPT}")
    if not git_dirty():
        print("No changes after fix-everything")
        return 0

    # Stage all changes (including new files) and commit them
    shell("git add -A")
    shell("git commit -m 'chore: auto fixes via pr agent'")

    token = os.getenv("GITHUB_TOKEN")
    repo = os.getenv("GITHUB_REPOSITORY")
    branch = (
        os.getenv("GITHUB_REF_NAME")
        or shell("git rev-parse --abbrev-ref HEAD", capture_output=True).stdout.strip()
    )
    if token and repo:
        remote = f"https://{token}@github.com/{repo}.git"
        shell(f"git push {remote} HEAD:{branch}")
    else:
        print("Changes committed locally; no GITHUB_TOKEN/REPOSITORY provided")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
