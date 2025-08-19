

#!/usr/bin/env python3
from __future__ import annotations
import argparse, requests, sys, json

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://127.0.0.1:8000")
    ap.add_argument("--mode", default="auto", choices=["auto","chit_chat","execute"])
    ap.add_argument("--codex", action="store_true", help="use /codex/apply instead of /chat")
    ap.add_argument("text", nargs="*")
    args = ap.parse_args()

    text = " ".join(args.text).strip() or sys.stdin.read()
    if args.codex:
        payload = {"task": text, "mode": args.mode}
        r = requests.post(f"{args.url}/codex/apply", json=payload, timeout=180)
    else:
        payload = {"prompt": text, "mode": args.mode}
        r = requests.post(f"{args.url}/chat", json=payload, timeout=180)

    r.raise_for_status()
    data = r.json()
    print(data.get("response","" ).strip())

if __name__ == "__main__":
    main()

