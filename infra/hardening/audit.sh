# <!-- FILE: /infra/hardening/audit.sh -->
#!/usr/bin/env bash
set -euo pipefail

echo "Checking SSH config"
sshd -T | grep -E 'passwordauthentication|permitrootlogin'

echo "Checking UFW"
ufw status verbose
