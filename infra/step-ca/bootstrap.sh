# <!-- FILE: /infra/step-ca/bootstrap.sh -->
#!/usr/bin/env bash
set -euo pipefail

step ca init --name "BlackRoad CA" --dns "stepca" --address ":9000" --provisioner "admin" --password-file <(echo "changeit")
