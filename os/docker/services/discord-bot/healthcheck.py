#!/usr/bin/env python3
import os
import sys

TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "")

if TOKEN and TOKEN != "changeme":
    print("token-configured")
    sys.exit(0)

print("stub-ok")
sys.exit(0)
