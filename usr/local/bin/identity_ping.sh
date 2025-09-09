#!/bin/bash
set -e
mkdir -p /var/log/blackroad
curl -fsS http://127.0.0.1:4010/api/codex/identity >> /var/log/blackroad/identity.log
echo >> /var/log/blackroad/identity.log
