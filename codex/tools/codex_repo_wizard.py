#!/usr/bin/env python3
"""
Codex Repo Wizard (Codex-native)
- Pins SSH host keys (strict, fail-closed) to codex/secrets/known_hosts
- Updates codex/config/repos.json interactively (Q&A flow)
- Clones/pulls all repos into codex/repos/
- Emits manifest -> codex/runtime/manifests/codex_repos_manifest.json
- (Optional) Emits Codex audit events -> codex/runtime/events/*.jsonl

Usage:
  python3 codex/tools/codex_repo_wizard.py               # interactive wizard
  python3 codex/tools/codex_repo_wizard.py --audit       # also emit audit events
  CODEX_SSH_KEY=~/.ssh/id_ed25519 python3 codex/tools/codex_repo_wizard.py
  GIT_TOKEN=... (for HTTPS auth=token repos)
"""

import json, os, sys, subprocess, shlex, uuid
from pathlib import Path
from datetime import datetime

# --- Codex paths (Codex Infinity conventions) ---
BASE_DIR              = Path("codex")
CFG_PATH              = BASE_DIR / "config" / "repos.json"
HOSTS_JSON_PATH       = BASE_DIR / "secrets" / "hosts.json"
KNOWN_HOSTS_PATH      = BASE_DIR / "secrets" / "known_hosts"
REPO_BASE_DEFAULT     = BASE_DIR / "repos"
MANIFEST_DIR          = BASE_DIR / "runtime" / "manifests"
MANIFEST_PATH         = MANIFEST_DIR / "codex_repos_manifest.json"
EVENTS_DIR            = BASE_DIR / "runtime" / "events"

# --- Default host fingerprints (edit via wizard prompt) ---
DEFAULT_HOST_FPS = {
    "github.com":    "SHA256:p2QAMXNIC1TJYWeIOttrVc98/R1BUFWu3/LiyKgUfQM=",
    "gitlab.com":    "SHA256:HbW3g8zUjNSksFbqTiUWPWg2Bq1x8xdGUrliXFzSnUw=",
    "bitbucket.org": "SHA256:FC73VB6C4OQLSCrjEayhMp9UMxS97caD/Yyi2bhW/J0=",
    # add your server(s) / Git SSH bastions here as needed
}

# -------------------------
# Helpers
# -------------------------
def ask(prompt, default=None, validate=None, yesno=False, allow_empty=False):
    d = f" [{default}]" if default is not None else ""
    q = f"{prompt}{d}: "
    while True:
        ans = input(q).strip()
        if ans == "" and default is not None and not allow_empty:
            ans = default
        if yesno:
            l = ans.lower()
            if l in ("y","yes","1","true"): return True
            if l in ("n","no","0","false"): return False
            print("Please answer y/n.")
            continue
        if not allow_empty and ans == "":
            print("Please enter a value.")
            continue
        if validate and ans and not validate(ans):
            print("Invalid value, try again.")
            continue
        return ans

def run(cmd, cwd=None, env=None):
    if isinstance(cmd, str):
        cmd = shlex.split(cmd)
    p = subprocess.Popen(cmd, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    out, _ = p.communicate()
    if p.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{out}")
    return out

def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)

def load_cfg():
    if CFG_PATH.exists():
        try:
            return json.loads(CFG_PATH.read_text())
        except Exception:
            print("Warning: existing repos.json invalid; starting fresh.")
    return {
        "base_dir": str(REPO_BASE_DEFAULT),
        "git_ssh_key": os.environ.get("CODEX_SSH_KEY", "~/.ssh/id_ed25519"),
        "git_ssh_strict_hostkey": True,
        "default_branch": "main",
        "repositories": []
    }

def save_cfg(cfg):
    ensure_dir(CFG_PATH.parent)
    CFG_PATH.write_text(json.dumps(cfg, indent=2))
    print(f"✔ Saved config -> {CFG_PATH}")

def ssh_keyscan(host):
    out = run(["ssh-keyscan","-T","5","-t","rsa,ecdsa,ed25519",host])
    return [line for line in out.splitlines() if line and not line.startswith("#")]

def fp_of_line(line):
    p = subprocess.run(["ssh-keygen","-lf","-"], input=line+"\n", capture_output=True, text=True)
    if p.returncode != 0: return None
    parts = p.stdout.strip().split()
    # ssh-keygen -lf output: "<bits> SHA256:<fingerprint> <comment> [type]"
    return parts[1] if len(parts) >= 2 else None
    return parts[1] if len(parts) >= 2 else None  # Example: "256 SHA256:abcdef... host (ED25519)"

def pin_known_hosts(host_map):
    ensure_dir(KNOWN_HOSTS_PATH.parent)
    valid_lines, errors = [], []
    for host, expected in host_map.items():
        lines = ssh_keyscan(host)
        matched = False
        for ln in lines:
            fp = fp_of_line(ln)
            if fp == expected:
                valid_lines.append(ln)
                matched = True
        if not matched:
            errors.append(f"{host}: no scanned key matched {expected}")
    if errors:
        raise RuntimeError("Host pinning failed:\n- " + "\n- ".join(errors))
    KNOWN_HOSTS_PATH.write_text("\n".join(valid_lines) + "\n")
    ensure_dir(HOSTS_JSON_PATH.parent)
    HOSTS_JSON_PATH.write_text(json.dumps(host_map, indent=2))
    print(f"✔ Pinned known_hosts -> {KNOWN_HOSTS_PATH}")
    print(f"✔ Saved fingerprints -> {HOSTS_JSON_PATH}")

def build_git_env(ssh_key_path: str, strict: bool):
    env = os.environ.copy()
    key = os.path.expanduser(ssh_key_path)
    if strict:
        env["GIT_SSH_COMMAND"] = (
            f"ssh -i {shlex.quote(key)} -o UserKnownHostsFile={shlex.quote(str(KNOWN_HOSTS_PATH))} "
            "-o StrictHostKeyChecking=yes"
        )
    else:
        env["GIT_SSH_COMMAND"] = (
            f"ssh -i {shlex.quote(key)} -o StrictHostKeyChecking=accept-new"
        )
    return env

def tokenize_url(url, token):
    if not token or not url.startswith("https://"): return url
    remain = url.split("https://",1)[1]
    return f"https://{token}@{remain}"

def repo_state(repo_dir: Path):
    try:
        sha = run(["git","rev-parse","HEAD"], cwd=repo_dir).strip()
        br  = run(["git","rev-parse","--abbrev-ref","HEAD"], cwd=repo_dir).strip()
        return sha, br
    except Exception:
        return None, None

def clone_or_pull(entry, base_dir: Path, env, shallow_default=False):
    name   = entry["name"]
    url    = entry["url"]
    branch = entry.get("branch") or "main"
    auth   = entry.get("auth","ssh")
    shallow= entry.get("shallow", shallow_default)

    repo_dir = base_dir / name
    final_url = url
    if auth == "token":
        token = os.environ.get("GIT_TOKEN","")
        if not token:
            raise RuntimeError(f"{name}: auth=token but GIT_TOKEN is not set.")
        final_url = tokenize_url(url, token)

    if not repo_dir.exists():
        ensure_dir(base_dir)
        cmd = ["git","clone","--branch",branch]
        if shallow: cmd += ["--depth","1","--no-single-branch"]
        cmd += [final_url, str(repo_dir)]
        run(cmd, env=env)
        action = "cloned"
    else:
        if not (repo_dir/".git").exists():
            raise RuntimeError(f"{repo_dir} exists but is not a git repo.")
        run(["git","remote","set-url","origin",final_url], cwd=repo_dir, env=env)
        run(["git","fetch","origin",branch], cwd=repo_dir, env=env)
        run(["git","checkout",branch], cwd=repo_dir, env=env)
        if shallow:
            try: run(["git","fetch","--depth","50","origin",branch], cwd=repo_dir, env=env)
            except Exception: pass
        run(["git","pull","--ff-only","origin",branch], cwd=repo_dir, env=env)
        action = "updated"

    sha, br = repo_state(repo_dir)
    return {
        "name": name,
        "path": str(repo_dir.resolve()),
        "branch": br or branch,
        "head": sha or "",
        "url": url,
        "auth": auth,
        "read_only": bool(entry.get("read_only", False)),
        "action": action
    }

def interactive_add_repos(cfg):
    print("\nAdd repositories (leave name empty to finish):")
    while True:
        name = ask("Repo name (short id)", allow_empty=True)
        if not name:
            break
        url = ask("Repo URL (SSH or HTTPS)")
        auth = ask("Auth method (ssh|https|token)", default="ssh", validate=lambda x: x in ("ssh","https","token"))
        branch = ask("Default branch", default=cfg.get("default_branch","main"))
        read_only = ask("Read-only (y/n)?", default="y", yesno=True)
        shallow = ask("Shallow clone (y/n)?", default="y", yesno=True)
        cfg["repositories"].append({
            "name": name,
            "url": url,
            "branch": branch,
            "auth": auth,
            "read_only": read_only,
            "shallow": shallow
        })
        print(f"✔ Added {name}")

def emit_codex_event(kind: str, payload: dict):
    ensure_dir(EVENTS_DIR)
    evt = {
        "id": str(uuid.uuid4()),
        "kind": kind,
        "ts": datetime.utcnow().isoformat() + "Z",
        "payload": payload
    }
    # one-file-per-event to keep tailing simple
    fn = EVENTS_DIR / f"{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}_{kind}.jsonl"
    with fn.open("a") as f:
        f.write(json.dumps(evt) + "\n")
    return fn

def minimal_audit(repo_path: Path):
    """Quick baseline audit (starter). Expand with Ψ′ rules."""
    must_have = [".gitignore", "README.md", "LICENSE", ".github/workflows"]
    missing = [m for m in must_have if not (repo_path / m).exists()]
    return {"missing": missing, "ok": not missing}

# -------------------------
# Main
# -------------------------
def main():
    audit_flag = "--audit" in sys.argv

    print("=== Codex Repo Wizard (host pinning + sync + codex events) ===\n")
    cfg = load_cfg()

    # General settings
    print("General settings:")
    cfg["base_dir"] = ask("Base directory for repos", default=cfg.get("base_dir", str(REPO_BASE_DEFAULT)))
    cfg["git_ssh_key"] = ask("SSH private key path (used for auth=ssh)", default=cfg.get("git_ssh_key","~/.ssh/id_ed25519"))
    cfg["git_ssh_strict_hostkey"] = ask("Strict SSH host key checking (y/n)", default="y", yesno=True)
    cfg["default_branch"] = ask("Default branch", default=cfg.get("default_branch","main"))
    save_cfg(cfg)

    # Host pinning
    print("\nHost key pinning:")
    if HOSTS_JSON_PATH.exists():
        try:
            host_map = json.loads(HOSTS_JSON_PATH.read_text())
        except Exception:
            host_map = DEFAULT_HOST_FPS.copy()
            print("Warning: existing hosts.json invalid; using defaults.")
    else:
        host_map = DEFAULT_HOST_FPS.copy()

    print("Current host fingerprints:")
    for h, fp in host_map.items():
        print(f" - {h}: {fp}")

    if ask("\nEdit/confirm host fingerprints now (y/n)?", default="y", yesno=True):
        while True:
            host = ask("Host to set (e.g., github.com) — leave empty to finish", allow_empty=True)
            if not host:
                break
            fp = ask("Expected SHA256 fingerprint (exact)", default=host_map.get(host,""))
            host_map[host] = fp

    print("\nPinning...")
    try:
        pin_known_hosts(host_map)
    except Exception as e:
        print(str(e))
        print("✖ Aborting due to host pinning failure.")
        sys.exit(1)

    # Repos
    print("\nCurrent repositories:")
    if cfg["repositories"]:
        for r in cfg["repositories"]:
            print(f" - {r['name']} ({r['auth']}) -> {r['url']}")
    else:
        print(" (none yet)")

    if ask("\nAdd more repositories now (y/n)?", default="y", yesno=True):
        interactive_add_repos(cfg)
        save_cfg(cfg)

    # Git env
    strict = bool(cfg.get("git_ssh_strict_hostkey", True))
    env = build_git_env(cfg.get("git_ssh_key","~/.ssh/id_ed25519"), strict)

    # Sync
    print("\n=== Syncing Repos ===")
    base = Path(os.path.expanduser(cfg["base_dir"])).resolve()
    ensure_dir(base)

    results, errors = [], []
    for entry in cfg["repositories"]:
        try:
            res = clone_or_pull(entry, base, env)
            print(f"✔ {entry['name']}: {res['action']} @ {res['branch']} ({res['head'][:7]})")
            results.append(res)

            if audit_flag:
                audit = minimal_audit(Path(res["path"]))
                evt_file = emit_codex_event("repo.audit.baseline", {
                    "name": res["name"],
                    "path": res["path"],
                    "branch": res["branch"],
                    "head": res["head"],
                    "findings": audit
                })
                print(f"  ↳ emitted audit event: {evt_file.name}")

        except Exception as e:
            print(f"✖ {entry.get('name','<unnamed>')}: {e}")
            errors.append({"name": entry.get("name"), "url": entry.get("url"), "error": str(e)})

    ensure_dir(MANIFEST_DIR)
    manifest = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "base_dir": str(base),
        "repos": results,
        "errors": errors
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))
    print(f"\n✔ Wrote manifest -> {MANIFEST_PATH}")

    if errors:
        emit_codex_event("repo.sync.errors", {"errors": errors})
        print("\nSome repos failed; fix credentials/URLs and re-run.")
    else:
        emit_codex_event("repo.sync.ok", {"count": len(results)})
    print("\nDone.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nCanceled.")
        sys.exit(130)
