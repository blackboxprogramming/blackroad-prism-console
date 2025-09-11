#!/usr/bin/env bash
# === BlackRoad Quantum — One-shot installer (Ubuntu/Debian) ===
set -euo pipefail

# 0) Sudo check
if [ "$EUID" -ne 0 ]; then echo "Please run as root (sudo)"; exit 1; fi

# 1) System deps
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y \
  git curl ca-certificates gnupg lsb-release software-properties-common \
  build-essential pkg-config \
  openssl wget unzip \
  jq tidy \
  ufw

# 2) Node.js 20 LTS (via Nodesource)
if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q '^v20'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
npm -v >/dev/null || { echo "npm missing"; exit 1; }

# 3) GitHub CLI (gh)
if ! command -v gh >/dev/null 2>&1; then
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] \
https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list
  apt-get update -y && apt-get install -y gh
fi

# 4) Security tools
# gitleaks
if ! command -v gitleaks >/dev/null 2>&1; then
  GL_VER="8.18.2"
  curl -fsSL -o /tmp/gitleaks.tar.gz \
    "https://github.com/gitleaks/gitleaks/releases/download/v${GL_VER}/gitleaks_${GL_VER}_linux_amd64.tar.gz"
  tar -xzf /tmp/gitleaks.tar.gz -C /usr/local/bin gitleaks
fi
# trivy
if ! command -v trivy >/dev/null 2>&1; then
  apt-get install -y apt-transport-https
  curl -fsSL https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor -o /usr/share/keyrings/trivy.gpg
  echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb stable main" \
    > /etc/apt/sources.list.d/trivy.list
  apt-get update -y && apt-get install -y trivy
fi

# 5) Open firewall for git + web (allow pull/push over SSH; HTTP/HTTPS)
ufw allow 22/tcp || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw --force enable || true
echo "✅ UFW allows 22/80/443 (SSH, HTTP, HTTPS)"

# 6) SSH setup for git (server user: www-data or current admin)
TARGET_USER="${SUDO_USER:-$(logname 2>/dev/null || echo root)}"
HOME_DIR="$(eval echo ~${TARGET_USER})"
mkdir -p "$HOME_DIR/.ssh"
chmod 700 "$HOME_DIR/.ssh"
touch "$HOME_DIR/.ssh/known_hosts"
ssh-keyscan -H github.com >> "$HOME_DIR/.ssh/known_hosts" 2>/dev/null || true
chown -R "$TARGET_USER":"$TARGET_USER" "$HOME_DIR/.ssh"
echo "✅ SSH known_hosts primed for github.com"

# 7) In repo: install npm dev deps & hooks (run only if we’re inside the repo)
if [ -d ".git" ]; then
  echo "📦 Installing repo dev dependencies…"
  npm pkg set name="blackroad-quantum" || true
  npm pkg set private=true || true
  npm i -D prettier@^3 eslint@^9 eslint-config-prettier@^9 husky@^9 lint-staged@^15 \
           @types/node@latest || true
  npx --yes husky install || true
  # pre-commit hook for lint-staged & gitleaks
  HOOK=".husky/pre-commit"
  mkdir -p .husky
  if ! grep -q "lint-staged" "$HOOK" 2>/dev/null; then
    cat >> "$HOOK" <<'HOOKS'
#!/usr/bin/env bash
. "$(dirname "$0")/_/husky.sh"
npx lint-staged || true
command -v gitleaks >/dev/null 2>&1 && gitleaks protect --staged --redact || true
HOOKS
    chmod +x "$HOOK"
  fi
  # lint-staged config (format HTML & JS)
  npx --yes json -I -f package.json -e '
    this["lint-staged"] = this["lint-staged"] || {};
    this["lint-staged"]["apps/**/*.html"] = ["npx prettier -w"];
    this["lint-staged"]["**/*.js"] = ["npx eslint --fix", "npx prettier -w"];
  ' || true
  echo "✅ npm dev deps installed & pre-commit hook configured"
fi

# 8) Ensure Actions trigger on BOTH pull_request and push for your core workflows
patch_wf() {
  local wf="$1"
  [ -f "$wf" ] || return 0
  if ! grep -q "pull_request" "$wf"; then
    # add pull_request trigger
    sed -i '0,/^on:/{s/^on:.*/on:\n  push:\n    branches: [ main ]\n  pull_request:\n    branches: [ main ]/}' "$wf"
  fi
}
patch_wf ".github/workflows/deploy-quantum.yml"
patch_wf ".github/workflows/codeql.yml"
patch_wf ".github/workflows/super-linter.yml"
patch_wf ".github/workflows/html-validate.yml"
patch_wf ".github/workflows/links.yml"

# 9) Quick self-tests
echo "🔎 Versions:"
node -v; npm -v; git --version; gh --version | head -n1
gitleaks version || true
trivy -v | head -n1 || true
tidy -v | head -n1 || true
jq --version

echo "✅ Installer finished."
echo "If running inside the repo, commit the workflow trigger edits:"
echo "  git add -A && git commit -m 'chore: installer enabled PR+push triggers' && git push"
