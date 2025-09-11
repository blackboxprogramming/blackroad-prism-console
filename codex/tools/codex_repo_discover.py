#!/usr/bin/env python3
"""Discover and sync GitHub repositories into Codex.

- List repositories for a GitHub user or org (default: blackboxprogramming)
- Merge them into ``codex/config/repos.json`` (``auth=ssh`` by default)
- Clone or pull each repo into ``codex/repos/``
- Write ``codex/runtime/manifests/codex_repos_manifest.json``
- Emit minimal Codex events (``repo.sync.ok`` / ``repo.sync.errors``)

Requirements:
  - Python 3.9+
  - git CLI available
  - (Recommended) SSH key and pinned ``known_hosts`` via your existing wizard
  - ``GITHUB_TOKEN``, ``GH_TOKEN``, or ``PERSONAL_ACCESS_TOKEN`` (optional) for private
    repositories or higher rate limits

Usage:
  python3 codex/tools/codex_repo_discover.py \
      --owner blackboxprogramming \
      --include-private \
      --exclude-forks
"""

import argparse
import json
import os
import shlex
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

BASE = Path("codex")
CFG_PATH = BASE / "config" / "repos.json"
MANIFEST_DIR = BASE / "runtime" / "manifests"
MANIFEST_PATH = MANIFEST_DIR / "codex_repos_manifest.json"
EVENTS_DIR = BASE / "runtime" / "events"
REPO_BASE_DEFAULT = BASE / "repos"

API_ROOT = "https://api.github.com"


def now_utc():
    return datetime.utcnow().isoformat() + "Z"


def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def load_json(p: Path, default=None):
    try:
        return json.loads(p.read_text())
    except Exception:
        return default


def save_json(p: Path, obj):
    ensure_dir(p.parent)
    p.write_text(json.dumps(obj, indent=2))


def run(cmd, cwd=None, env=None, check=True):
    if isinstance(cmd, str):
        cmd = shlex.split(cmd)
    p = subprocess.Popen(
        cmd, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
    )
    out, _ = p.communicate()
    if check and p.returncode != 0:
        raise RuntimeError(f"$ {' '.join(cmd)}\n{out}")
    return out


def gh_request(url, token=None):
    hdrs = {"Accept": "application/vnd.github+json", "User-Agent": "codex-repo-discover/1.0"}
    if token:
        hdrs["Authorization"] = f"Bearer {token}"
    req = Request(url, headers=hdrs)
    return urlopen(req, timeout=30)


def gh_list_repos(owner, token=None, include_private=False):
    # Works for both users and orgs: GET /users/{owner}/repos and /orgs/{owner}/repos behave similarly.
    # We try orgs first, fall back to users.
    endpoints = [f"/orgs/{owner}/repos", f"/users/{owner}/repos"]
    all_repos = []
    for ep in endpoints:
        try:
            page = 1
            while True:
                url = f"{API_ROOT}{ep}?per_page=100&page={page}&type=all&sort=updated"
                resp = gh_request(url, token)
                data = json.loads(resp.read().decode("utf-8"))
                if not isinstance(data, list):
                    break
                if not data:
                    break
                all_repos.extend(data)
                page += 1
            if all_repos:
                break
        except HTTPError as e:
            if e.code == 404:
                continue
            raise
    if not include_private:
        all_repos = [r for r in all_repos if not r.get("private")]
    return all_repos


def to_cfg_entry(repo, default_branch="main"):
    name = repo["name"]
    # Prefer SSH URL so we leverage your pinned known_hosts & SSH key
    ssh_url = repo.get("ssh_url")  # git@github.com:owner/name.git
    branch = repo.get("default_branch") or default_branch
    return {
        "name": name,
        "url": ssh_url,
        "branch": branch,
        "auth": "ssh",
        "read_only": False,
        "shallow": True,
    }


def merge_into_repos_json(new_entries, base_dir: Path, default_branch="main"):
    cfg = load_json(CFG_PATH) or {
        "base_dir": str(base_dir),
        "git_ssh_key": os.environ.get("CODEX_SSH_KEY", "~/.ssh/id_ed25519"),
        "git_ssh_strict_hostkey": True,
        "default_branch": default_branch,
        "repositories": [],
    }
    existing = {r["name"]: r for r in cfg.get("repositories", [])}
    updated = 0
    added = 0
    for e in new_entries:
        if e["name"] in existing:
            # update URL/branch/auth/shallow but keep read_only flag if set
            old = existing[e["name"]]
            old.update({k: e[k] for k in ("url", "branch", "auth", "shallow")})
            existing[e["name"]] = old
            updated += 1
        else:
            existing[e["name"]] = e
            added += 1
    cfg["repositories"] = sorted(existing.values(), key=lambda r: r["name"].lower())
    save_json(CFG_PATH, cfg)
    return cfg, added, updated


def build_git_env(cfg):
    env = os.environ.copy()
    key = os.path.expanduser(cfg.get("git_ssh_key", "~/.ssh/id_ed25519"))
    # Reuse your wizard’s strict host key policy if known_hosts is already prepared.
    known_hosts = Path("codex/secrets/known_hosts")
    if known_hosts.exists():
        env["GIT_SSH_COMMAND"] = (
            f"ssh -i {shlex.quote(key)} -o UserKnownHostsFile={shlex.quote(str(known_hosts))} "
            "-o StrictHostKeyChecking=yes"
        )
    else:
        env["GIT_SSH_COMMAND"] = f"ssh -i {shlex.quote(key)} -o StrictHostKeyChecking=accept-new"
    return env


def repo_state(repo_dir: Path):
    try:
        sha = run(["git", "rev-parse", "HEAD"], cwd=repo_dir).strip()
        br = run(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=repo_dir).strip()
        return sha, br
    except Exception:
        return None, None


def clone_or_pull(entry, base: Path, env):
    name = entry["name"]
    url = entry["url"]
    branch = entry.get("branch") or "main"
    shallow = entry.get("shallow", True)

    repo_dir = base / name
    ensure_dir(base)

    if not repo_dir.exists():
        cmd = ["git", "clone", "--branch", branch]
        if shallow:
            cmd += ["--depth", "1", "--no-single-branch"]
        cmd += [url, str(repo_dir)]
        run(cmd, env=env)
        action = "cloned"
    else:
        if not (repo_dir / ".git").exists():
            raise RuntimeError(f"{repo_dir} exists but is not a git repo")
        run(["git", "remote", "set-url", "origin", url], cwd=repo_dir, env=env)
        run(["git", "fetch", "origin", branch], cwd=repo_dir, env=env)
        run(["git", "checkout", branch], cwd=repo_dir, env=env)
        # prefer fast-forward only
        try:
            run(["git", "merge", "--ff-only", f"origin/{branch}"], cwd=repo_dir, env=env)
        except Exception:
            # fallback: rebase to keep history linear
            run(["git", "rebase", f"origin/{branch}"], cwd=repo_dir, env=env)
        action = "updated"

    sha, br = repo_state(repo_dir)
    return {
        "name": name,
        "path": str(repo_dir.resolve()),
        "branch": br or branch,
        "head": sha or "",
        "url": url,
        "auth": entry.get("auth", "ssh"),
        "read_only": bool(entry.get("read_only", False)),
        "action": action,
    }


def emit(kind, payload):
    ensure_dir(EVENTS_DIR)
    fn = EVENTS_DIR / f"{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}_{kind}.jsonl"
    with fn.open("a") as f:
        f.write(
            json.dumps(
                {
                    "id": f"{kind}:{int(time.time()*1000)}",
                    "kind": kind,
                    "ts": now_utc(),
                    "payload": payload,
                }
            )
            + "\n"
        )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--owner", default="blackboxprogramming")
    ap.add_argument("--include-private", action="store_true")
    ap.add_argument("--exclude-forks", action="store_true")
    ap.add_argument("--base-dir", default=str(REPO_BASE_DEFAULT))
    ap.add_argument("--default-branch", default="main")
    args = ap.parse_args()

    token = (
        os.environ.get("GITHUB_TOKEN")
        or os.environ.get("GH_TOKEN")
        or os.environ.get("PERSONAL_ACCESS_TOKEN")
    )

    # 1) Discover
    try:
        repos = gh_list_repos(args.owner, token=token, include_private=args.include_private)
    except HTTPError as e:
        print(f"GitHub API error: {e}", file=sys.stderr)
        sys.exit(1)
    except URLError as e:
        print(f"Network error: {e}", file=sys.stderr)
        sys.exit(1)

    if args.exclude_forks:
        repos = [r for r in repos if not r.get("fork")]

    entries = [
        to_cfg_entry(r, default_branch=args.default_branch) for r in repos if r.get("ssh_url")
    ]

    # 2) Merge into repos.json
    cfg, added, updated = merge_into_repos_json(
        entries, Path(args.base_dir), default_branch=args.default_branch
    )
    print(f"Discovered: {len(entries)} | Added: {added} | Updated: {updated}")

    # 3) Sync (clone/pull)
    env = build_git_env(cfg)
    base = Path(cfg["base_dir"]).expanduser().resolve()
    ensure_dir(base)

    results, errors = [], []
    for entry in cfg["repositories"]:
        # only process repos from this owner; skip others already present in config
        if not (entry["url"] or "").endswith(f"{args.owner}.git") and f":{args.owner}/" not in (
            entry["url"] or ""
        ):
            continue
        try:
            res = clone_or_pull(entry, base, env)
            print(f"✔ {res['name']}: {res['action']} @ {res['branch']} ({res['head'][:7]})")
            results.append(res)
        except Exception as e:
            print(f"✖ {entry['name']}: {e}")
            errors.append({"name": entry["name"], "url": entry["url"], "error": str(e)})

    # 4) Manifest + events
    ensure_dir(MANIFEST_DIR)
    manifest = {
        "generated_at": now_utc(),
        "base_dir": str(base),
        "repos": results,
        "errors": errors,
    }
    save_json(MANIFEST_PATH, manifest)

    if errors:
        emit("repo.sync.errors", {"errors": errors})
        print(f"\nCompleted with {len(errors)} error(s). See manifest:\n  {MANIFEST_PATH}")
        sys.exit(3)
    else:
        emit("repo.sync.ok", {"count": len(results)})
        print(f"\nAll good. Manifest written:\n  {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
