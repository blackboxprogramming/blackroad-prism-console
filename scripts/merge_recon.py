#!/usr/bin/env python3
"""Generate MERGE_PLAN.md and merge_plan.json from GitHub PR activity."""
from __future__ import annotations

import datetime as dt
import json
import os
from pathlib import Path
from typing import Dict, List, Set

import requests

OWNER = "blackboxprogramming"
REPO = "blackroad-prism-console"
BASE = f"https://api.github.com/repos/{OWNER}/{REPO}"

# Mapping of changed paths to services
SERVICE_MAP = {
    "api": ["srv/blackroad-api/", "srv/blackroad-api/server_full.js", "srv/blackroad-api/server_min.js", "modules/"],
    "ui": ["var/www/blackroad/"],
    "nginx": ["etc/nginx/"],
    "yjs": ["srv/yjs-server/"],
    "bridge": ["srv/ollama-bridge/"],
    "jsond": ["srv/br-jsond/"],
    "units": ["etc/systemd/system/"],
}

HEADERS = {}
if os.getenv("GITHUB_TOKEN"):
    HEADERS["Authorization"] = f"token {os.environ['GITHUB_TOKEN']}"


def github_json(url: str) -> List[dict]:
    resp = requests.get(url, headers=HEADERS)
    resp.raise_for_status()
    return resp.json()


def list_prs() -> List[dict]:
    """Return open PRs updated within 7 days and PRs merged within 7 days."""
    since = dt.datetime.utcnow() - dt.timedelta(days=7)
    prs: List[dict] = []
    open_prs = github_json(f"{BASE}/pulls?state=open&per_page=100")
    for pr in open_prs:
        updated = dt.datetime.strptime(pr["updated_at"], "%Y-%m-%dT%H:%M:%SZ")
        if updated >= since:
            prs.append(pr)
        if len(prs) >= 20:
            break
    closed_prs = github_json(f"{BASE}/pulls?state=closed&per_page=100")
    merged_count = 0
    for pr in closed_prs:
        merged_at = pr.get("merged_at")
        if merged_at and dt.datetime.strptime(merged_at, "%Y-%m-%dT%H:%M:%SZ") >= since:
            prs.append(pr)
            merged_count += 1
            if merged_count >= 20:
                break
    return prs


def files_for_pr(number: int) -> List[dict]:
    return github_json(f"{BASE}/pulls/{number}/files?per_page=100")


def impacted_services(paths: Set[str]) -> Set[str]:
    impacts: Set[str] = set()
    for p in paths:
        for svc, prefixes in SERVICE_MAP.items():
            if any(p.startswith(pref) for pref in prefixes):
                impacts.add(svc)
    return impacts


def detect_risks(pr_files: List[dict], impacts: Set[str]) -> List[str]:
    risks: List[str] = []
    paths = {f["filename"] for f in pr_files}
    # Bridge ESM check
    if "bridge" in impacts:
        if any(f["filename"].startswith("srv/ollama-bridge/") and f["filename"].endswith(".js") for f in pr_files):
            if not any(f["filename"] == "srv/ollama-bridge/package.json" for f in pr_files):
                risks.append("bridge missing package.json with type module")
    # CSP checks
    if "nginx" in impacts:
        for f in pr_files:
            if f["filename"].startswith("etc/nginx") and f.get("patch"):
                patch = f["patch"]
                if "connect-src *" in patch:
                    risks.append("CSP connect-src overly permissive")
                if "worker-src" in patch and "'self'" not in patch:
                    risks.append("CSP worker-src missing 'self'")
        if any("snippets/blackroad-partner-mtls.conf" in p for p in paths) and not any(
            pf.startswith("modules/partner_relay_mtls") or pf.startswith("srv/blackroad-api/modules/partner_relay_mtls")
            for pf in paths
        ):
            risks.append("nginx mTLS snippet without API partner_relay_mtls module")
    # Unit ExecStart checks
    if "units" in impacts:
        for f in pr_files:
            if f["filename"].startswith("etc/systemd/system") and f.get("patch"):
                for line in f["patch"].splitlines():
                    if line.startswith("+ExecStart") and not (
                        "/usr/bin/node" in line or "/usr/bin/python3" in line
                    ):
                        risks.append("unit ExecStart path unusual")
    return risks


def main() -> None:
    prs = list_prs()
    pr_data = []
    file_map: Dict[int, Set[str]] = {}
    for pr in prs:
        number = pr["number"]
        files = files_for_pr(number)
        paths = {f["filename"] for f in files}
        file_map[number] = paths
        impacts = impacted_services(paths)
        risks = detect_risks(files, impacts)
        pr_data.append(
            {
                "number": number,
                "title": pr["title"],
                "state": "merged" if pr.get("merged_at") else pr["state"],
                "branch": pr["head"]["ref"],
                "impacts": sorted(impacts),
                "risks": risks,
            }
        )

    # Detect conflicts
    for i, a in enumerate(pr_data):
        for b in pr_data[i + 1 :]:
            if file_map[a["number"]] & file_map[b["number"]]:
                a.setdefault("risks", []).append(f"conflicts with PR #{b['number']}")
                b.setdefault("risks", []).append(f"conflicts with PR #{a['number']}")

    # Order queue: services -> nginx -> ui
    order = {"api": 0, "yjs": 0, "bridge": 0, "jsond": 0, "nginx": 1, "ui": 2, "units": 0}
    pr_data.sort(key=lambda d: max(order.get(s, 3) for s in d["impacts"] or [3]))

    # Preflight/verify lists per PR
    for pr in pr_data:
        impacts = pr["impacts"]
        preflight: List[str] = []
        if "yjs" in impacts:
            preflight.append("systemctl restart yjs-server")
        if "api" in impacts:
            preflight.append("systemctl restart blackroad-api")
        if "bridge" in impacts:
            preflight.append("systemctl restart ollama-bridge")
        if "jsond" in impacts:
            preflight.append("systemctl restart br-jsond")
        if "nginx" in impacts:
            preflight.append("nginx -t && systemctl reload nginx")
        pr["preflight"] = preflight
        pr["verify"] = [
            "curl -s https://blackroad.io/healthz",
            "curl -s http://127.0.0.1:4010/api/llm/health",
            "curl -s http://127.0.0.1:12345/yjs/test",
            "curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403",
            "curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects",
            "curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices",
        ]

    fix_forward = []
    for pr in pr_data:
        if any("bridge missing package.json" in r for r in pr["risks"]):
            fix_forward.append("Add srv/ollama-bridge/package.json with {\"type\":\"module\"}")
        if any("CSP" in r for r in pr["risks"]):
            fix_forward.append("Review nginx CSP to enforce worker-src 'self' and connect-src 'self'")
        if any("unit ExecStart" in r for r in pr["risks"]):
            fix_forward.append("Ensure systemd unit ExecStart uses /usr/bin/node or /usr/bin/python3")

    # Write JSON
    json_path = Path("merge_plan.json")
    with json_path.open("w", encoding="utf-8") as f:
        json.dump({"queue": pr_data, "fix_forward": fix_forward}, f, indent=2)

    # Write Markdown plan
    md_lines = ["# Merge Plan", "", "## Pull Requests", "", "| PR | Title | State | Impacts | Risks |", "|---|---|---|---|---|"]
    for pr in pr_data:
        md_lines.append(
            f"| #{pr['number']} | {pr['title']} | {pr['state']} | {', '.join(pr['impacts']) or 'none'} | {'; '.join(pr['risks']) or 'none'} |"
        )
    md_lines.extend(
        [
            "",
            "## Dependency Graph",
            "",
            "```",
            "api,yjs,bridge,jsond -> nginx -> ui",
            "```",
            "",
            "## Topological Merge Queue",
            "",
        ]
    )
    for pr in pr_data:
        md_lines.append(f"1. PR #{pr['number']} - {pr['title']} ({', '.join(pr['impacts'])})")
    md_lines.extend(["", "## Preflight & Verify", ""])
    for pr in pr_data:
        md_lines.append(f"### PR #{pr['number']}")
        md_lines.append("**Preflight**")
        for cmd in pr["preflight"]:
            md_lines.append(f"- `{cmd}`")
        md_lines.append("**Verify**")
        for cmd in pr["verify"]:
            md_lines.append(f"- `{cmd}`")
        md_lines.append("")
    if fix_forward:
        md_lines.extend(["## Fix-Forward Tasks", ""])
        for task in fix_forward:
            md_lines.append(f"- {task}")
    Path("MERGE_PLAN.md").write_text("\n".join(md_lines), encoding="utf-8")


if __name__ == "__main__":
    main()
