#!/usr/bin/env python3
"""
Codex Merge Agent
- Reads codex/runtime/manifests/codex_repos_manifest.json
- For each repo: fetch → pull --rebase (fast-forward preferred) → push (with retries)
- Skips read_only repos
- On conflict: abort, create work branch (codex/merge/<timestamp>), push, emit event
- Emits events your codex_operator can watch:
  - repo.merge.ok
  - repo.merge.skipped
  - repo.merge.conflict
  - repo.push.error

Environment (optional):
  CODEX_GIT_USER_NAME="Lucidia Codex"
  CODEX_GIT_USER_EMAIL="codex@blackroad.io"
  GIT_TOKEN=...         # only needed if any repo uses auth=token
  CODEX_SSH_KEY=...     # if using a non-default SSH key (wizard sets env)
"""
import json, os, sys, subprocess, shlex, time, uuid
from pathlib import Path
from datetime import datetime

BASE = Path("codex")
MANIFEST = BASE/"runtime"/"manifests"/"codex_repos_manifest.json"
EVENTS = BASE/"runtime"/"events"
LOCKS = BASE/"runtime"/"locks"
LOGS = BASE/"runtime"/"logs"
CONFIG = BASE/"config"/"merge_rules.json"

DEFAULT_RULES = {
  "strategy": "rebase",          # "rebase" or "merge"
  "push_retries": 5,
  "push_backoff_sec": 2,
  "fast_forward_only": False,    # if True, will not rebase/merge; only ff
  "create_pr_on_conflict": False,# (GitHub-only, requires GITHUB_TOKEN)
  "signoff": True,
  "work_branch_prefix": "codex/merge"
}

def now(): return datetime.utcnow().isoformat()+"Z"
def shell(cmd, cwd=None, env=None, check=True):
    if isinstance(cmd, str): cmd = shlex.split(cmd)
    p = subprocess.Popen(cmd, cwd=cwd, env=env, stdout=subprocess.PIPE,
                         stderr=subprocess.STDOUT, text=True)
    out, _ = p.communicate()
    if check and p.returncode != 0:
        raise RuntimeError(f"$ {' '.join(cmd)}\n{out}")
    return out

def emit(kind, payload):
    EVENTS.mkdir(parents=True, exist_ok=True)
    evt = {"id": str(uuid.uuid4()), "kind": kind, "ts": now(), "payload": payload}
    fn = EVENTS / f"{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}_{kind}.jsonl"
    with fn.open("a") as f: f.write(json.dumps(evt)+"\n")
    return evt

def load_manifest():
    if not MANIFEST.exists():
        print(f"Manifest not found: {MANIFEST}", file=sys.stderr)
        sys.exit(2)
    return json.loads(MANIFEST.read_text())

def load_rules():
    if not CONFIG.exists(): return DEFAULT_RULES
    try:
        rules = json.loads(CONFIG.read_text())
        merged = DEFAULT_RULES.copy()
        merged.update(rules or {})
        return merged
    except Exception:
        return DEFAULT_RULES

def git_config(repo_dir):
    name = os.getenv("CODEX_GIT_USER_NAME", "Lucidia Codex")
    email = os.getenv("CODEX_GIT_USER_EMAIL", "codex@blackroad.io")
    shell(["git","config","user.name",name], cwd=repo_dir)
    shell(["git","config","user.email",email], cwd=repo_dir)

def has_local_changes(repo_dir):
    out = shell(["git","status","--porcelain"], cwd=repo_dir)
    return bool(out.strip())

def current_branch(repo_dir):
    return shell(["git","rev-parse","--abbrev-ref","HEAD"], cwd=repo_dir).strip()

def ensure_branch(repo_dir, branch):
    try:
        shell(["git","checkout",branch], cwd=repo_dir)
    except Exception:
        # If the branch doesn't exist locally, create it tracking origin
        fetch(repo_dir, branch)
        shell(["git","checkout","-b",branch,f"origin/{branch}"], cwd=repo_dir)

def fetch(repo_dir, branch):
    shell(["git","fetch","origin",branch], cwd=repo_dir)

def try_fast_forward(repo_dir, branch):
    # attempt ff-only
    try:
        shell(["git","merge","--ff-only",f"origin/{branch}"], cwd=repo_dir)
        return True
    except Exception:
        return False

def rebase_onto_origin(repo_dir, branch):
    shell(["git","rebase",f"origin/{branch}"], cwd=repo_dir)

def merge_no_ff(repo_dir, branch, signoff=True):
    cmd = ["git","merge","--no-ff",f"origin/{branch}"]
    if signoff: cmd.insert(2,"--signoff")
    shell(cmd, cwd=repo_dir)

def abort_conflicts(repo_dir):
    # abort any rebase/merge in progress
    git_dir = Path(repo_dir) / ".git"
    if (git_dir/"rebase-apply").exists() or (git_dir/"rebase-merge").exists():
        shell(["git","rebase","--abort"], cwd=repo_dir, check=False)
    shell(["git","merge","--abort"], cwd=repo_dir, check=False)

def head_sha(repo_dir):
    return shell(["git","rev-parse","HEAD"], cwd=repo_dir).strip()

def push_with_retries(repo_dir, branch, retries, backoff):
    for i in range(1, retries+1):
        try:
            shell(["git","push","origin",branch], cwd=repo_dir)
            return True, f"push ok (attempt {i})"
        except Exception as e:
            if i == retries: return False, str(e)
            time.sleep(backoff * (2 ** (i-1)))
    return False, "unreachable"

def create_work_branch_and_push(repo_dir, branch, prefix):
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    work = f"{prefix}/{branch}/{ts}"
    shell(["git","checkout","-b",work], cwd=repo_dir)
    ok, msg = push_with_retries(repo_dir, work, 1, 1)
    return work, ok, msg

def process_repo(repo, rules):
    name = repo["name"]
    path = repo["path"]
    branch = repo["branch"]
    read_only = repo.get("read_only", False)

    repo_dir = Path(path)
    if not repo_dir.exists():
        return emit("repo.merge.skipped", {"name": name, "reason": "path_missing"})

    git_config(repo_dir)

    # Safety: don’t clobber local uncommitted work
    if has_local_changes(repo_dir):
        return emit("repo.merge.skipped", {"name": name, "reason": "local_changes"})

    # Sync
    try:
        ensure_branch(repo_dir, branch)
        fetch(repo_dir, branch)
    except Exception as e:
        return emit("repo.merge.skipped", {"name": name, "reason": f"fetch_error: {e}"})

    # Merge strategy
    try:
        if rules["fast_forward_only"]:
            if try_fast_forward(repo_dir, branch):
                merged = True
            else:
                merged = False  # needs rebase/merge but disallowed; skip
        else:
            # prefer FF; if not, do strategy
            if try_fast_forward(repo_dir, branch):
                merged = True
            else:
                if rules["strategy"] == "rebase":
                    try:
                        rebase_onto_origin(repo_dir, branch)
                        merged = True
                    except Exception as e:
                        abort_conflicts(repo_dir)
                        # Conflict → work branch
                        work, ok, msg = create_work_branch_and_push(repo_dir, branch, rules["work_branch_prefix"])
                        emit("repo.merge.conflict", {
                            "name": name, "branch": branch, "work_branch": work,
                            "error": f"rebase_conflict: {e}", "pushed": ok, "push_msg": msg
                        })
                        return
                else:
                    # merge --no-ff (signoff optional)
                    try:
                        merge_no_ff(repo_dir, branch, signoff=rules.get("signoff", True))
                        merged = True
                    except Exception as e:
                        abort_conflicts(repo_dir)
                        work, ok, msg = create_work_branch_and_push(repo_dir, branch, rules["work_branch_prefix"])
                        emit("repo.merge.conflict", {
                            "name": name, "branch": branch, "work_branch": work,
                            "error": f"merge_conflict: {e}", "pushed": ok, "push_msg": msg
                        })
                        return
    except Exception as e:
        abort_conflicts(repo_dir)
        return emit("repo.merge.skipped", {"name": name, "reason": f"merge_step_error: {e}"})

    # Push (if allowed)
    if read_only:
        return emit("repo.merge.ok", {"name": name, "branch": branch, "head": head_sha(repo_dir), "pushed": False, "reason": "read_only"})

    ok, msg = push_with_retries(repo_dir, branch, rules["push_retries"], rules["push_backoff_sec"])
    if not ok:
        emit("repo.push.error", {"name": name, "branch": branch, "error": msg})
        return

    emit("repo.merge.ok", {"name": name, "branch": branch, "head": head_sha(repo_dir), "pushed": True})

def main():
    LOCKS.mkdir(parents=True, exist_ok=True)
    lock = LOCKS/"merge.lock"
    try:
        # naive single-host lock
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.write(fd, str(os.getpid()).encode()); os.close(fd)
    except FileExistsError:
        print("Another merge agent appears to be running. (merge.lock present)")
        sys.exit(0)

    try:
        manifest = load_manifest()
        rules = load_rules()
        repos = manifest.get("repos", [])
        for r in repos:
            process_repo(r, rules)
    finally:
        try: os.remove(lock)
        except Exception: pass

if __name__ == "__main__":
    main()
