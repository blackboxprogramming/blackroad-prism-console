#!/usr/bin/env python3
import os
import subprocess
import datetime
import pathlib
import re
import sys

def sh(cmd, cwd=None):
    return subprocess.run(
        cmd,
        cwd=cwd,
        shell=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    ).stdout.strip()


def harvest_repo(repo_path, default_branch, recent_hours, stale_days):
    now = datetime.datetime.utcnow()
    recent_cut = (now - datetime.timedelta(hours=recent_hours)).isoformat(timespec="seconds") + "Z"
    stale_cut = (now - datetime.timedelta(days=stale_days)).date().isoformat()

    current = sh("git rev-parse --abbrev-ref HEAD", cwd=repo_path)
    ahead = sh(f"git rev-list --left-right --count {default_branch}...HEAD", cwd=repo_path)
    commits = sh(
        f"git log --since='{recent_cut}' --pretty='format:%h %ad %s' --date=relative",
        cwd=repo_path,
    )
    branches = sh(
        "git for-each-ref --format='%(refname:short)|%(committerdate:short)' refs/heads",
        cwd=repo_path,
    )

    stale = []
    for line in branches.splitlines():
        b, d = line.split("|")
        if b == default_branch:
            continue
        try:
            if d < stale_cut:
                stale.append(f"{b} (last: {d})")
        except Exception:
            pass

    return {
        "repo": repo_path,
        "branch": current,
        "divergence": ahead,  # "behind ahead"
        "recent_commits": commits.splitlines()[:10],
        "stale": stale[:10],
    }


def read_tasks(files):
    lines = []
    for path in files:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8", errors="ignore") as handle:
                lines.extend(line.rstrip() for line in handle if line.strip())
    # naive parse: TODO, DOING, BLOCKED
    def pick(tag):
        return [line for line in lines if re.search(fr"\b{tag}\b", line, re.IGNORECASE)]

    return {
        "now": pick("NOW|DOING|PRIORITY|P1"),
        "next": pick("TODO|NEXT|P2"),
        "blocked": pick("BLOCKED|WAITING"),
        "quick": [line for line in lines if re.search(r"\b(quick|5min|tiny)\b", line, re.IGNORECASE)],
    }


def last_reflection(path):
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8", errors="ignore") as handle:
        lines = [line.rstrip() for line in handle if line.strip()]
    return lines[-1] if lines else None


def load_yaml(path):
    import yaml

    with open(path, "r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def main(cfg_path):
    cfg = load_yaml(cfg_path)
    sections = []

    # repos
    repo_blocks = []
    for repo in cfg.get("repos", []):
        info = harvest_repo(
            repo["path"],
            repo.get("default_branch", "main"),
            cfg.get("recent_commit_hours", 24),
            cfg.get("stale_branch_days", 7),
        )
        behind, ahead = (info["divergence"].split() + ["0", "0"])[:2]
        recent_block = "\n".join(
            f"  - {line}" for line in info["recent_commits"] if line
        ) or "  - none"
        stale_block = "\n".join(
            f"  - {line}" for line in info["stale"] if line
        ) or "  - none"
        repo_blocks.append(
            "\n".join(
                [
                    f"### {info['repo']}",
                    f"• Branch: {info['branch']}  • Divergence: -{behind}/+{ahead}",
                    "• Recent commits:",
                    recent_block,
                    f"• Stale branches (> {cfg.get('stale_branch_days', 7)}d):",
                    stale_block,
                ]
            )
        )

    sections.append("## Code\n" + "\n".join(repo_blocks))

    # tasks
    tasks = read_tasks(cfg.get("tasks_files", []))

    def bullet(title, items):
        body = "\n  - " + ("\n  - ".join(items[:10]) if items else "none")
        return f"**{title}**{body}"

    sections.append(
        "## Tasks\n"
        + "\n".join(
            [
                bullet("NOW", tasks["now"]),
                bullet("NEXT", tasks["next"]),
                bullet("BLOCKED", tasks["blocked"]),
                bullet("Quick Wins", tasks["quick"]),
            ]
        )
    )

    # reflection
    reflection = last_reflection(cfg.get("reflect_log", ""))
    sections.append("## Reflection\n" + (reflection or "none"))

    out = (
        "# Lucidia — Next‑Day Activation Map\n"
        f"Generated: {datetime.datetime.utcnow().isoformat(timespec='seconds')}Z\n\n"
        + "\n\n".join(sections)
        + "\n"
    )

    out_path = pathlib.Path(cfg["output_map"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(out, encoding="utf-8")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    config_path = (
        sys.argv[1]
        if len(sys.argv) > 1
        else os.path.expanduser("~/lucidia/rituals/activation.config.yaml")
    )
    main(config_path)
