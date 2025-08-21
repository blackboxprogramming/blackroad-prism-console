# <!-- FILE: /infra/provision.sh -->
#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null; then
  apt-get update && apt-get install -y ca-certificates curl gnupg lsb-release
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \$(. /etc/os-release && echo \$VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
  apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

if ! command -v docker-compose >/dev/null; then
  curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
fi

cd "$(dirname "$0")/../stack"
DOCKER_COMPOSE=docker-compose.yml
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

/usr/local/bin/docker-compose -f "$DOCKER_COMPOSE" up -d

echo "Stack deployed. Access Caddy on port 80/443."
