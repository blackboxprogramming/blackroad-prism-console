#!/bin/bash
set -euo pipefail

apt-get install -y tor
echo 'HiddenServiceDir /var/lib/tor/lucidia_onion/' >> /etc/tor/torrc
echo 'HiddenServicePort 80 127.0.0.1:80' >> /etc/tor/torrc
systemctl restart tor
tor_host=$(cat /var/lib/tor/lucidia_onion/hostname 2>/dev/null || true)
[ -n "$tor_host" ] && echo "Lucidia onion address: $tor_host" | tee -a docs/ACCESS.md
