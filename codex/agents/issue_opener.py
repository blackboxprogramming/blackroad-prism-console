#!/usr/bin/env python3
"""
Codex Issue Opener (GitHub)
- Reads recent audit events (repo.audit.baseline)
- For each repo with missing baseline files, opens/ensures a tracking issue
- Idempotent: searches open issues by a stable title tag and avoids duplicates

Requirements:
  - GITHUB_TOKEN with "repo" scope
  - origin URL must be GitHub SSH/HTTPS

Reads:
  codex/runtime/events/*.jsonl
  codex/runtime/manifests/codex_repos_manifest.json

Emits:
  repo.issues.opened
"""
import os, re, json, base64, time
from pathlib import Path
from datetime import datetime
import urllib.request, urllib.error

BASE = Path("codex")
EVENTS = BASE/"runtime"/"events"
MANIFEST = BASE/"runtime"/"manifests"/"codex_repos_manifest.json"
OUT_EVENTS = EVENTS

TOKEN = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN") or os.getenv("PERSONAL_ACCESS_TOKEN")

def emit(kind, payload):
    OUT_EVENTS.mkdir(parents=True, exist_ok=True)
    fn = OUT_EVENTS / f"{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}_{kind}.jsonl"
    with fn.open("a") as f:
        f.write(json.dumps({"id": f"{kind}:{int(time.time()*1000)}", "kind": kind, "ts": datetime.utcnow().isoformat()+"Z", "payload": payload}) + "\n")

def recent_audits(limit=200):
    files = sorted(EVENTS.glob("*.jsonl"))
    audits = []
    for fp in reversed(files):
        try:
            for line in reversed(fp.read_text().splitlines()):
                if not line.strip():
                    continue
                evt = json.loads(line)
                if evt.get("kind") != "repo.audit.baseline":
                    continue
                audits.append(evt)
                if len(audits) >= limit:
                    return list(reversed(audits))
        except Exception:
            continue
    return list(reversed(audits))

def parse_github_owner_repo(origin_url: str):
    # Supports ssh: git@github.com:owner/repo.git  or https: https://github.com/owner/repo.git
    m = re.search(r"github\.com[:/](?P<owner>[^/]+)/(?P<repo>[^\.]+)", origin_url)
    if not m:
        return None, None
    return m.group("owner"), m.group("repo")

def gh_api(path, method="GET", body=None):
    if not TOKEN:
        raise RuntimeError("GITHUB_TOKEN is required to open issues.")
    url = f"https://api.github.com{path}"
    hdrs = {"Accept": "application/vnd.github+json", "User-Agent": "codex-issue-opener/1.0", "Authorization": f"Bearer {TOKEN}"}
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, headers=hdrs, method=method, data=data)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

def ensure_issue(owner, repo, title, body):
    # search existing open issues
    q = f'repo:{owner}/{repo} is:issue is:open in:title "{title}"'
    res = gh_api(f"/search/issues?q={urllib.parse.quote(q)}")
    if res.get("total_count",0) > 0:
        return {"owner": owner, "repo": repo, "title": title, "existing": True}
    # create
    created = gh_api(f"/repos/{owner}/{repo}/issues", method="POST", body={"title": title, "body": body})
    return {"owner": owner, "repo": repo, "title": title, "number": created.get("number"), "url": created.get("html_url"), "existing": False}

def load_manifest():
    try:
        return json.loads(MANIFEST.read_text())
    except Exception:
        return {"repos": []}

def origin_url_for(repo_name, manifest):
    for r in manifest.get("repos", []):
        if r.get("name") == repo_name:
            return r.get("url")
    return None

def main():
    manifest = load_manifest()
    audits = recent_audits()
    opened = []
    for evt in audits:
        name = evt.get("payload",{}).get("name")
        findings = evt.get("payload",{}).get("findings",{})
        missing = findings.get("missing",[])
        if not name or not missing:
            continue
        origin = origin_url_for(name, manifest)
        if not origin:
            continue
        owner, repo = parse_github_owner_repo(origin)
        if not owner:
            continue
        title = f"[Codex] Baseline missing files: {name}"
        body = (
 f"""Codex baseline audit detected missing required files in **{name}**:

- {os.linesep.join(f"* `{m}`" for m in missing)}

**Action**
Please add the missing files. This issue was opened automatically by Codex.

_Opened: {datetime.utcnow().isoformat()}Z_
""")
        try:
            info = ensure_issue(owner, repo, title, body)
            opened.append(info)
        except urllib.error.HTTPError as e:
            opened.append({"owner": owner, "repo": repo, "title": title, "error": f"HTTP {e.code}"})
        except Exception as e:
            opened.append({"owner": owner, "repo": repo, "title": title, "error": str(e)})

    if opened:
        emit("repo.issues.opened", {"items": opened})
    print(f"Issues processed: {len(opened)}")

if __name__ == "__main__":
    main()
