#!/usr/bin/env python3
import json
import os
import sys
import urllib.request

url = os.getenv("WEBHOOK_URL")  # set in secrets or server env
payload = {
    "app": "blackroad",
    "event": sys.argv[1] if len(sys.argv) > 1 else "event",
    "meta": sys.argv[2:],
}
req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode(),
    headers={"Content-Type": "application/json"},
)
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        print(r.status)
except Exception as e:
    print("webhook error:", e, file=sys.stderr)
