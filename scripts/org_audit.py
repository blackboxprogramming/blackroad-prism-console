#!/usr/bin/env python3
"""Org-wide repository audit for BlackRoad.

This script discovers repositories under a GitHub organisation or user and
produces audit artefacts including a markdown report, JSON findings and an
issues CSV. The implementation intentionally aims to be light-weight so it can
run in restricted environments. Network failures are captured and surfaced in
outputs so the caller can understand what went wrong.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import pathlib
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import requests


# --------------------------- configuration ---------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run BlackRoad organisation audit")
    parser.add_argument("--org", default=os.environ.get("ORG_OR_USER", "blackboxprogramming"))
    parser.add_argument("--local-root", default=os.environ.get("LOCAL_ROOT", "/opt/blackroad/audits/current"))
    parser.add_argument("--spec-root", default=os.environ.get("SPEC_ROOT", "/opt/blackroad/specs"))
    parser.add_argument("--token", default=os.environ.get("GITHUB_TOKEN"))
    parser.add_argument("--include", nargs="*", default=os.environ.get("INCLUDE_REPOS", "").split())
    parser.add_argument("--exclude", nargs="*", default=os.environ.get("EXCLUDE_REPOS", "fork-*,archive-*".split(',')))
    parser.add_argument("--default-branch", default=os.environ.get("DEFAULT_BRANCH", "main"))
    parser.add_argument("--rate-limit-floor", type=int, default=int(os.environ.get("RATE_LIMIT_FLOOR", "2000")))
    return parser.parse_args()


# --------------------------- data models ---------------------------

@dataclass
class RepoFinding:
    repo: str
    default_branch: str
    languages: Dict[str, int] = field(default_factory=dict)
    loc: int = 0
    has_tests: bool = False
    coverage: Optional[str] = None
    deps: Dict[str, Any] = field(default_factory=dict)
    security: Dict[str, Any] = field(default_factory=dict)
    ci: Dict[str, Any] = field(default_factory=dict)
    infra: Dict[str, Any] = field(default_factory=dict)
    docs: Dict[str, Any] = field(default_factory=dict)
    gaps: List[Dict[str, Any]] = field(default_factory=list)
    access: Dict[str, Any] = field(default_factory=lambda: {"ok": True})


# --------------------------- helpers ---------------------------

GITHUB_API = "https://api.github.com"


def ensure_dir(path: str | pathlib.Path) -> pathlib.Path:
    p = pathlib.Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def github_request(url: str, token: Optional[str]) -> requests.Response:
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()
    return response


# --------------------------- audit steps ---------------------------


def list_repos(org: str, token: Optional[str]) -> List[Dict[str, Any]]:
    repos: List[Dict[str, Any]] = []
    page = 1
    while True:
        url = f"{GITHUB_API}/orgs/{org}/repos?per_page=100&page={page}"
        try:
            resp = github_request(url, token)
        except Exception as e:  # noqa: BLE001
            raise RuntimeError(f"Failed to list repositories: {e}")
        data = resp.json()
        if not data:
            break
        repos.extend(data)
        page += 1
    return repos


def snapshot_spec(spec_root: pathlib.Path) -> pathlib.Path:
    ensure_dir(spec_root)
    today = dt.datetime.utcnow().strftime("%Y%m%d")
    spec_path = spec_root / f"blackroad_spec_{today}.md"
    if not spec_path.exists():
        spec_path.write_text("# BlackRoad Spec Snapshot\n\nPlaceholder spec snapshot.\n")
    return spec_path


def write_json(path: pathlib.Path, data: Any) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, sort_keys=True)


def write_csv(path: pathlib.Path, rows: List[Dict[str, Any]], headers: List[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def generate_report(path: pathlib.Path, repos: List[RepoFinding], access_failures: List[Dict[str, Any]], spec_path: pathlib.Path) -> None:
    lines = ["# BlackRoad Audit Report", ""]
    lines.append("## Exec Summary")
    if repos:
        lines.append(f"Scanned {len(repos)} repositories.")
    else:
        lines.append("No repositories scanned. See Access Failures section for details.")
    lines.append("")
    lines.append("## Access Failures")
    if access_failures:
        lines.append("| Repository | Step | Reason | Recommendation |")
        lines.append("| --- | --- | --- | --- |")
        for fail in access_failures:
            lines.append(f"| {fail.get('repo','?')} | {fail.get('step')} | {fail.get('reason')} | {fail.get('fix','')} |")
    else:
        lines.append("No access failures detected.")
    lines.append("")
    lines.append("## Spec Snapshot")
    lines.append(f"Spec file: `{spec_path}`")
    lines.append("")
    path.write_text("\n".join(lines))


def run_audit() -> None:
    args = parse_args()

    local_root = ensure_dir(args.local_root)
    spec_root = ensure_dir(args.spec_root)

    spec_path = snapshot_spec(spec_root)

    findings: List[RepoFinding] = []
    access_failures: List[Dict[str, Any]] = []

    try:
        repos_meta = list_repos(args.org, args.token)
    except Exception as e:  # noqa: BLE001
        access_failures.append({
            "repo": args.org,
            "step": "list_repos",
            "reason": str(e),
            "fix": "Check network connectivity and GitHub token scopes",
        })
        repos_meta = []

    # In an offline environment repos_meta will be empty and no further analysis occurs.
    for meta in repos_meta:
        finding = RepoFinding(repo=meta["name"], default_branch=meta.get("default_branch", args.default_branch))
        findings.append(finding)

    # Write outputs
    report_path = local_root / "BLACKROAD_AUDIT_REPORT.md"
    findings_json_path = local_root / "findings.json"
    issues_csv_path = local_root / "issues.csv"
    sbom_root = ensure_dir(local_root / "sboms")
    # No SBOM generation in this minimal implementation; directory left empty.

    generate_report(report_path, findings, access_failures, spec_path)
    write_json(findings_json_path, [f.__dict__ for f in findings])
    write_csv(issues_csv_path, [], ["repo", "severity", "area", "title", "suggested_fix", "file", "line", "created"])

    # Write last run summary for potential scheduling integrations
    last_run_path = local_root.parent / "last_run.txt"
    last_run_path.write_text(f"Audit completed on {dt.datetime.utcnow().isoformat()} UTC\n")


if __name__ == "__main__":
    run_audit()
