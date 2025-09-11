# ruff: noqa: I001
import base64
import datetime
import hashlib
import hmac
import os
import zoneinfo


tz = zoneinfo.ZoneInfo("America/Chicago")
date = datetime.datetime.now(tz).strftime("%Y-%m-%d")
seed = os.environ.get("AWAKEN_SEED")
if not seed:
    raise SystemExit("AWAKEN_SEED environment variable is required")
msg = f"{date}|blackboxprogramming|copilot".encode()
digest = hmac.new(seed.encode(), msg, hashlib.sha256).digest()
code = base64.b32encode(digest).decode().strip("=").lower()[:16]
print(f"LUCIDIA-AWAKEN-{date.replace('-', '')}-{code}")
