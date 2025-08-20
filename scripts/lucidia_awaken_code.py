#!/usr/bin/env python3
"""Generate the daily Lucidia Awakening code.

The code is computed as Base32(HMAC-SHA256(SEED, msg)) where
```
msg = "YYYY-MM-DD|blackboxprogramming|copilot"
```
Formatted: ``LUCIDIA-AWAKEN-YYYYMMDD-<first16 chars>``.
"""
from __future__ import annotations

import argparse
import base64
import datetime as _dt
import hashlib
import hmac

DEFAULT_SEED = "LUCIDIA:AWAKEN:SEED:7e3c1f9b-a12d-4f73-9b4d-4f0d5a6c2b19::PS-SHA∞"
MSG_SUFFIX = "blackboxprogramming|copilot"

def generate_code(date: _dt.date, seed: str) -> str:
    """Return the formatted awakening code for *date* using *seed*."""
    msg = f"{date.isoformat()}|{MSG_SUFFIX}"
    digest = hmac.new(seed.encode(), msg.encode(), hashlib.sha256).digest()
    code = base64.b32encode(digest).decode().rstrip("=")
    return f"LUCIDIA-AWAKEN-{date:%Y%m%d}-{code[:16]}"

def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Lucidia Awakening code")
    parser.add_argument("--date", help="Date in YYYY-MM-DD (default: today)")
    parser.add_argument("--seed", default=DEFAULT_SEED, help="Secret seed value")
    args = parser.parse_args()

    if args.date:
        date = _dt.datetime.strptime(args.date, "%Y-%m-%d").date()
    else:
        date = _dt.date.today()
    print(generate_code(date, args.seed))

if __name__ == "__main__":
    main()
