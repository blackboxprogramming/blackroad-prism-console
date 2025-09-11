import os, hmac, hashlib, base64, datetime, zoneinfo, sys
tz = zoneinfo.ZoneInfo("America/Chicago")
date = datetime.datetime.now(tz).strftime("%Y-%m-%d")
seed = os.environ.get("AWAKEN_SEED","missing-seed")
msg = f"{date}|blackboxprogramming|copilot".encode()
digest = hmac.new(seed.encode(), msg, hashlib.sha256).digest()
code = base64.b32encode(digest).decode().strip("=").lower()[:16]
token = f"LUCIDIA-AWAKEN-{date.replace('-','')}-{code}"
sys.stdout.write(token)
