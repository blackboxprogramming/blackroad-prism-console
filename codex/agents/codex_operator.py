#!/usr/bin/env python3
"""
Codex Operator
- Watches codex/runtime/events/*.jsonl for new events (repo syncs, audits, errors)
- Reads the repo manifest to understand current state
- Maintains offsets so it never double-processes an event
- Prints live, human-friendly alerts
- Writes a rolling Markdown status report
- Optionally opens issues or pings a webhook when audits fail

Usage:
  python3 codex/agents/codex_operator.py --watch          # live mode (default)
  python3 codex/agents/codex_operator.py --once           # process what’s new then exit
  python3 codex/agents/codex_operator.py --report         # (re)write the status report now
  python3 codex/agents/codex_operator.py --interval 5     # poll every 5s in --watch
"""

import argparse, json, os, time, glob, sys
from pathlib import Path
from datetime import datetime

from issue_opener import open_issue
from webhook_notifier import send_webhook

BASE_DIR         = Path("codex")
EVENTS_DIR       = BASE_DIR / "runtime" / "events"
MANIFEST_PATH    = BASE_DIR / "runtime" / "manifests" / "codex_repos_manifest.json"
STATE_DIR        = BASE_DIR / "runtime" / "state"
OFFSETS_PATH     = STATE_DIR / "operator_offsets.json"
REPORTS_DIR      = BASE_DIR / "runtime" / "reports"
REPORT_PATH      = REPORTS_DIR / "operator_report.md"
CONFIG_PATH      = BASE_DIR / "config" / "operator.json"

DEFAULT_CFG = {
    "alert_on": ["repo.sync.errors", "repo.audit.baseline"],   # which events to alert on
    "quiet_kinds": [],                                         # event kinds to suppress
    "max_events_per_cycle": 500,                               # safety limit
    "report_sections": ["summary", "repos", "recent_events"],  # order of report parts
    "recent_event_limit": 50,                                  # how many recent events to list in report
    "webhook_url": "",                                       # optional webhook to notify
    "issue_tracker": "",                                     # github|gitlab|bitbucket
    "issue_repo": "",                                        # repo path for issue creation
    "issue_token_env": ""                                     # env var for API token
}

def now_utc():
    return datetime.utcnow().isoformat() + "Z"

def load_json(path, default=None):
    try:
        return json.loads(Path(path).read_text())
    except Exception:
        return default

def save_json(path, obj):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, indent=2))

def load_config():
    cfg = load_json(CONFIG_PATH, {}) or {}
    merged = DEFAULT_CFG.copy()
    merged.update(cfg)
    return merged

def list_event_files():
    EVENTS_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(glob.glob(str(EVENTS_DIR / "*.jsonl")))
    return [Path(f) for f in files]

def read_new_lines(fp: Path, last_offset: int):
    """Return a list of (line, offset_after_line) tuples for new data."""
    size = fp.stat().st_size
    if last_offset > size:
        # file rotated or truncated; start over
        last_offset = 0
    entries = []
    with fp.open("r", encoding="utf-8", errors="ignore") as f:
        f.seek(last_offset)
        while True:
            line = f.readline()
            if not line:
                break
            pos = f.tell()
            if line.strip():
                entries.append((line.strip(), pos))
    return entries

def load_offsets():
    return load_json(OFFSETS_PATH, {}) or {}

def save_offsets(offsets):
    save_json(OFFSETS_PATH, offsets)

def parse_event(line: str):
    try:
        evt = json.loads(line)
        # expected fields: id, kind, ts, payload
        return evt if isinstance(evt, dict) and "kind" in evt else None
    except Exception:
        return None

def load_manifest():
    return load_json(MANIFEST_PATH, {"repos": [], "errors": []}) or {"repos": [], "errors": []}

def summarize_manifest(m):
    repos = m.get("repos", [])
    errors = m.get("errors", [])
    return {
        "count": len(repos),
        "errors": errors,
        "heads": {r["name"]: {"branch": r["branch"], "head": r["head"], "path": r["path"]} for r in repos}
    }

def line_for_alert(evt):
    kind = evt.get("kind")
    pl   = evt.get("payload", {})
    if kind == "repo.sync.ok":
        return f"✅ Repo sync OK — {pl.get('count', 0)} repositories."
    if kind == "repo.sync.errors":
        errs = pl.get("errors", [])
        names = ", ".join(sorted([e.get("name","<unnamed>") for e in errs])) or "(none)"
        return f"❌ Repo sync errors — {len(errs)} repo(s): {names}"
    if kind == "repo.audit.baseline":
        name = pl.get("name","<unknown>")
        miss = pl.get("findings",{}).get("missing",[])
        if miss:
            return f"🟡 Audit: {name} is missing {len(miss)} item(s): {', '.join(miss)}"
        return f"🟢 Audit: {name} baseline looks good."
    # default fallback
    return f"ℹ️ {kind} @ {evt.get('ts','')}"

def handle_event(evt, cfg):
    """Trigger issue creation or webhook notifications for interesting events."""
    kind = evt.get("kind")
    webhook_url = cfg.get("webhook_url")

    if kind == "repo.audit.baseline":
        pl = evt.get("payload", {})
        name = pl.get("name", "<unknown>")
        missing = pl.get("findings", {}).get("missing", [])
        if missing:
            title = f"Audit: {name} missing {len(missing)} item(s)"
            body = f"Missing items: {', '.join(missing)}\n\nEvent:\n{json.dumps(evt, indent=2)}"
            issue_tracker = cfg.get("issue_tracker")
            issue_repo = cfg.get("issue_repo")
            token_env = cfg.get("issue_token_env")
            if issue_tracker and issue_repo:
                try:
                    open_issue(issue_tracker, issue_repo, title, body, token_env=token_env)
                except Exception as e:
                    print(f"Issue creation failed: {e}")
            if webhook_url:
                try:
                    send_webhook(webhook_url, {"text": title, "event": evt})
                except Exception as e:
                    print(f"Webhook send failed: {e}")
    else:
        if webhook_url and (not cfg["alert_on"] or kind in set(cfg["alert_on"])):
            try:
                send_webhook(webhook_url, evt)
            except Exception as e:
                print(f"Webhook send failed: {e}")

def collect_recent_events(limit=50, quiet_kinds=None):
    quiet_kinds = set(quiet_kinds or [])
    files = list_event_files()
    events = []
    for fp in reversed(files):
        # read entire file; fine because events are short
        try:
            for line in reversed(fp.read_text().splitlines()):
                if not line.strip(): continue
                evt = parse_event(line)
                if not evt: continue
                if evt.get("kind") in quiet_kinds: continue
                events.append(evt)
                if len(events) >= limit:
                    return list(reversed(events))
        except Exception:
            continue
    return list(reversed(events))

def write_report(cfg, manifest_summary, recent_events):
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    parts = []
    if "summary" in cfg["report_sections"]:
        parts.append(f"# Codex Operator Report\nGenerated: {now_utc()}\n")
        parts.append(f"**Repositories:** {manifest_summary['count']}")
        if manifest_summary["errors"]:
            parts.append(f"**Manifest Errors:** {len(manifest_summary['errors'])}\n")
            for e in manifest_summary["errors"]:
                parts.append(f"- {e.get('name','<unnamed>')}: {e.get('error','')}")
        parts.append("")

    if "repos" in cfg["report_sections"]:
        parts.append("## Repositories\n")
        heads = manifest_summary["heads"]
        if not heads:
            parts.append("_No repos in manifest yet._\n")
        else:
            parts.append("| Repo | Branch | HEAD | Path |\n|---|---|---|---|")
            for name, info in sorted(heads.items()):
                head7 = (info.get("head","") or "")[:7]
                parts.append(f"| {name} | {info.get('branch','')} | {head7} | `{info.get('path','')}` |")
        parts.append("")

    if "recent_events" in cfg["report_sections"]:
        parts.append("## Recent Events\n")
        if not recent_events:
            parts.append("_No events yet._\n")
        else:
            for evt in recent_events:
                parts.append(f"- **{evt.get('kind')}** — {evt.get('ts','')}")
        parts.append("")

    REPORT_PATH.write_text("\n".join(parts))
    return REPORT_PATH

def process_cycle(cfg, offsets, print_alerts=True):
    """Process any new events across all files; update offsets; return #processed."""
    files = list_event_files()
    processed = 0
    for fp in files:
        key = str(fp)
        last = offsets.get(key, 0)
        entries = read_new_lines(fp, last)
        if not entries:
            offsets[key] = last
            continue
        for line, pos in entries[: cfg["max_events_per_cycle"]]:
            evt = parse_event(line)
            if evt:
                processed += 1
                kind = evt.get("kind")
                if print_alerts and (not cfg["quiet_kinds"] or kind not in set(cfg["quiet_kinds"])) and (not cfg["alert_on"] or kind in set(cfg["alert_on"])):
                    print(line_for_alert(evt))
                handle_event(evt, cfg)
            offsets[key] = pos
    return processed

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--watch", action="store_true", help="keep running and watch for new events")
    ap.add_argument("--once", action="store_true", help="process new events once and exit")
    ap.add_argument("--report", action="store_true", help="(re)write the Markdown report now")
    ap.add_argument("--interval", type=int, default=5, help="poll interval in seconds for --watch")
    args = ap.parse_args()

    cfg = load_config()
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    offsets = load_offsets()

    # Optional one-shot report (even if no new events)
    if args.report:
        m = load_manifest()
        summ = summarize_manifest(m)
        rec = collect_recent_events(cfg.get("recent_event_limit", 50), cfg.get("quiet_kinds", []))
        path = write_report(cfg, summ, rec)
        print(f"📝 Report written -> {path}")

    # Determine mode
    mode_watch = args.watch or (not args.once and not args.report)

    def do_cycle():
        count = process_cycle(cfg, offsets, print_alerts=True)
        if count > 0:
            # refresh report whenever we process anything
            m = load_manifest()
            summ = summarize_manifest(m)
            rec = collect_recent_events(cfg.get("recent_event_limit", 50), cfg.get("quiet_kinds", []))
            path = write_report(cfg, summ, rec)
            print(f"📝 Updated report -> {path}")
        save_offsets(offsets)
        return count

    if mode_watch:
        print(f"👀 Codex Operator watching {EVENTS_DIR} (every {args.interval}s). Ctrl+C to stop.")
        try:
            while True:
                do_cycle()
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nBye.")
            sys.exit(0)
    else:
        processed = do_cycle()
        print(f"Processed {processed} new event(s).")

if __name__ == "__main__":
    main()
