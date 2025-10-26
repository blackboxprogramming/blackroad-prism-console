#!/usr/bin/env python3
import os
import sys

TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "")

if TOKEN and TOKEN != "changeme":
    print("token-configured")
    sys.exit(0)

print("stub-ok")
# Minimal "I'm alive" check; extend to verify gateway heartbeat if desired
import sys
sys.exit(0)
