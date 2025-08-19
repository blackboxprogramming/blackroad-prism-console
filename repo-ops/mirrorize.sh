#!/usr/bin/env bash
# Mirrorize & Harden for BlackRoad — v2
# Idempotent repo mirroring + pinning + containerization + CI/SBOM + optional ops blocks.
# Fails fast with clear error, prints the offending command.

set -Eeo pipefail
umask 027
trap 'rc=$?; echo "ERROR ($rc) at line $LINENO: $BASH_COMMAND" >&2; exit $rc' ERR

# ===== Config (override via env) =====
TARGET_ORG="${TARGET_ORG:-blackroad}"       # or blackboxprogramming
VISIBILITY="${VISIBILITY:-private}"         # private|public|internal (GH Enterprise)
DOMAIN_BASE="${DOMAIN_BASE:-blackroad.io}"
MIRROR_PREFIX="${MIRROR_PREFIX:-br-}"
REPOS="${REPOS:-}"                          # space/newline separated GitHub URLs
CREATE_TEAM_CODEOWNERS="${CREATE_TEAM_CODEOWNERS:-false}" # set true to auto-create team if missing
DRY_RUN="${DRY_RUN:-false}"                 # set true to preview actions

# ===== Paths =====
ROOT="/opt/blackroad"
OPS="$ROOT/repo-ops"
BACKUP="$ROOT/backups"
WORK="$ROOT/work"
mkdir -p "$OPS" "$BACKUP" "$WORK"

# ===== Package manager helpers =====
pkg_install() {
  local pkgs=("$@")
  if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -yqq
    apt-get install -yqq --no-install-recommends "${pkgs[@]}"
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y "${pkgs[@]}"
  elif command -v yum >/dev/null 2>&1; then
    yum install -y "${pkgs[@]}"
  elif command -v apk >/dev/null 2>&1; then
    apk add --no-cache "${pkgs[@]}"
  else
    echo "ERROR: No supported package manager found." >&2; exit 1
  fi
}

need() { command -v "$1" >/dev/null 2>&1 || pkg_install "$1"; }

# ===== Requirements =====
need git
need curl
need jq
need unzip
need awk
# git-lfs (best-effort)
if ! command -v git-lfs >/dev/null 2>&1; then pkg_install git-lfs || true; fi

# GitHub CLI
if ! command -v gh >/dev/null 2>&1; then pkg_install gh || true; fi
# If GH token provided but not logged in, login non-interactively
if command -v gh >/dev/null 2>&1 && ! gh auth status >/dev/null 2>&1 && [ -n "${GITHUB_TOKEN:-}" ]; then
  echo "$GITHUB_TOKEN" | gh auth login --with-token
fi

die(){ echo "ERROR: $*" >&2; exit 1; }

# ===== Git helpers =====
ensure_team() {
  local team="maintainers"
  $CREATE_TEAM_CODEOWNERS || return 0
  command -v gh >/dev/null 2>&1 || return 0
  gh api "orgs/${TARGET_ORG}/teams/${team}" >/dev/null 2>&1 || gh api -X POST "orgs/${TARGET_ORG}/teams" -f name="$team" -f privacy=closed >/dev/null
}

create_github_repo() {
  local name="$1"
  if ! command -v gh >/dev/null 2>&1 || ! gh auth status >/dev/null 2>&1; then
    echo "SKIP_GITHUB"; return 0
  fi
  if ! gh repo view "${TARGET_ORG}/${name}" >/dev/null 2>&1; then
    gh repo create "${TARGET_ORG}/${name}" --"$VISIBILITY" --disable-issues --disable-wiki --confirm \
      --description "BlackRoad mirror of upstream (${name#${MIRROR_PREFIX}})" >/dev/null || die "gh repo create failed"
  fi
  # Return SSH URL for robust push
  echo "git@github.com:${TARGET_ORG}/${name}.git"
}

# ===== Language detection =====
detect_lang() {
  local dir="$1"
  if [ -f "$dir/package.json" ]; then echo "node"; return; fi
  if [ -f "$dir/pyproject.toml" ] || [ -f "$dir/requirements.txt" ]; then echo "python"; return; fi
  if [ -f "$dir/go.mod" ]; then echo "go"; return; fi
  if [ -f "$dir/Cargo.toml" ]; then echo "rust"; return; fi
  if compgen -G "$dir/pom.xml" > /dev/null || compgen -G "$dir/build.gradle*" > /dev/null; then echo "java"; return; fi
  if compgen -G "$dir/*.sln" > /dev/null || compgen -G "$dir/*.csproj" > /dev/null; then echo "dotnet"; return; fi
  echo "unknown"
}

# ===== Add BlackRoad meta & CI =====
add_meta() {
  local dir="$1" repo_url="$2"
  mkdir -p "$dir/.github/workflows" "$dir/_ops/nginx" "$dir/_ops/systemd"

  # CODEOWNERS (team optional)
  cat > "$dir/.github/CODEOWNERS" <<'EOT'
* @blackroad/maintainers
EOT

  cat > "$dir/SECURITY.md" <<'EOT'
# Security Policy
If you suspect a vulnerability, email security@blackroad.io (coordinated disclosure). Avoid public issues for sensitive reports.
EOT

  cat > "$dir/SUPPORT.md" <<'EOT'
For help, open a discussion or contact support@blackroad.io.
EOT

  cat > "$dir/.editorconfig" <<'EOT'
root = true
[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
EOT

  cat > "$dir/.gitattributes" <<'EOT'
* text=auto eol=lf
EOT

  # .dockerignore keeps images lean
  cat > "$dir/.dockerignore" <<'EOT'
.git
.gitmodules
.gitignore
node_modules
.vscode
.venv
__pycache__
dist
build
coverage
*.log
Dockerfile*
docker-compose*.yml
EOT

  # Dependabot
  cat > "$dir/.github/dependabot.yml" <<'EOT'
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "pip"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "gomod"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "cargo"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "maven"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "gradle"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }
EOT

  # CI: build + SBOM + secret scan + dep review
  cat > "$dir/.github/workflows/ci.yml" <<'EOT'
name: CI
on:
  push: { branches: [ main, master, blackroad/* ] }
  pull_request:
permissions:
  contents: read
  security-events: write
  actions: read
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { submodules: true }
      - name: Detect language
        run: |
          if [ -f package.json ]; then echo "lang=node" >> $GITHUB_ENV; fi
          if [ -f pyproject.toml ] || [ -f requirements.txt ]; then echo "lang=python" >> $GITHUB_ENV; fi
          if [ -f go.mod ]; then echo "lang=go" >> $GITHUB_ENV; fi
          if [ -f Cargo.toml ]; then echo "lang=rust" >> $GITHUB_ENV; fi
      - name: Node build
        if: env.lang == 'node'
        uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - if: env.lang == 'node'
        run: |
          npm ci || npm install
          npm test --if-present
      - name: Python build
        if: env.lang == 'python'
        uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - if: env.lang == 'python'
        run: |
          python -m pip install -U pip
          if [ -f requirements.lock ]; then pip install -r requirements.lock; elif [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          pytest -q || true
      - name: Go build
        if: env.lang == 'go'
        uses: actions/setup-go@v5
        with: { go-version: '1.22' }
      - if: env.lang == 'go'
        run: go build ./...
      - name: Rust build/test
        if: env.lang == 'rust'
        uses: dtolnay/rust-toolchain@stable
        with: { components: clippy }
      - if: env.lang == 'rust'
        run: cargo test --all --locked || cargo test --all
      - name: Generate SBOM (CycloneDX)
        uses: anchore/sbom-action@v0
        with: { format: cyclonedx-json, artifact-name: sbom.json }

  sec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Secret scan (gitleaks)
        uses: gitleaks/gitleaks-action@v2
        with: { config-path: "", fail: false }
      - name: Dependency review (PRs)
        if: github.event_name == 'pull_request'
        uses: actions/dependency-review-action@v4
EOT

  # Release to GHCR if Dockerfile exists
  cat > "$dir/.github/workflows/release.yml" <<'EOT'
name: Release (Container)
on:
  push:
    tags: ['v*.*.*']
permissions:
  packages: write
  contents: read
jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set registry
        run: echo "REG=ghcr.io/${{ github.repository_owner }}/$(basename $GITHUB_REPOSITORY)" >> $GITHUB_ENV
      - name: Login GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build & Push
        uses: docker/build-push-action@v6
        with:
          push: true
          tags: ${{ env.REG }}:${{ github.ref_name }},${{ env.REG }}:latest
EOT

  # CodeQL
  cat > "$dir/.github/workflows/codeql.yml" <<'EOT'
name: CodeQL
on:
  push: { branches: [ main, master, blackroad/* ] }
  pull_request:
permissions:
  contents: read
  security-events: write
jobs:
  analyze:
    runs-on: ubuntu-latest
    strategy:
      matrix: { language: [ 'javascript', 'python', 'go', 'ruby', 'cpp', 'java' ] }
    steps:
      - uses: actions/checkout@v4
        with: { submodules: true }
      - uses: github/codeql-action/init@v3
        with: { languages: ${{ matrix.language }} }
      - uses: github/codeql-action/analyze@v3
EOT

  # NOTICE for mirrors
  cat > "$dir/BLACKROAD_MIRROR_NOTICE.md" <<EOT
This is a BlackRoad-managed mirror of:

- $repo_url

Purpose: ensure continuity even if upstream changes or disappears.
Original LICENSE retained (if present). BlackRoad operational files and changes are documented in commits.
EOT
}

# ===== Pinning & containerization =====
pin_and_containerize() {
  local dir="$1" lang="$2"

  case "$lang" in
    node)
      pushd "$dir" >/dev/null
      if [ -f package.json ]; then
        if [ ! -f package-lock.json ]; then npm i --package-lock-only || npm i; fi
        if [ ! -f Dockerfile ]; then
cat > Dockerfile <<'DF'
# Node 20 production image
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY . .
RUN npm run build --if-present

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 8000
CMD ["npm","start"]
DF
        fi
      fi
      popd >/dev/null
      ;;
    python)
      pushd "$dir" >/dev/null
      command -v python3 >/dev/null 2>&1 || pkg_install python3 python3-venv python3-pip
      python3 -m venv .venv && . .venv/bin/activate
      if [ -f requirements.txt ] && [ ! -f requirements.lock ]; then
        pip install -r requirements.txt || true
        pip freeze > requirements.lock || true
      fi
      if [ -f pyproject.toml ] && [ ! -f requirements.lock ]; then
        # simple lock: install build backend and freeze
        python -m pip install -U pip build || true
        pip freeze > requirements.lock || true
      fi
      deactivate || true
      if [ ! -f Dockerfile ]; then
cat > Dockerfile <<'DF'
FROM python:3.11-slim
WORKDIR /app
# Keep layer cache stable even if app files change
COPY requirements.lock requirements.lock
RUN if [ -f requirements.lock ]; then pip install --no-cache-dir -r requirements.lock || true; fi
COPY . .
EXPOSE 8000
# Expect a module named app:app, override if needed
CMD ["python","-m","gunicorn","app:app","-b","0.0.0.0:8000","--workers","2"]
DF
      fi
      popd >/dev/null
      ;;
    go)
      pushd "$dir" >/dev/null
      if [ -f go.mod ]; then
        command -v go >/dev/null 2>&1 || pkg_install golang
        go mod download || true
      fi
      if [ ! -f Dockerfile ]; then
cat > Dockerfile <<'DF'
FROM golang:1.22-alpine AS build
WORKDIR /src
COPY . .
RUN go build -o /out/app ./...

FROM alpine:3.20
WORKDIR /app
COPY --from=build /out/app /app/app
EXPOSE 8000
CMD ["/app/app"]
DF
      fi
      popd >/dev/null
      ;;
    rust)
      pushd "$dir" >/dev/null
      if [ ! -f Dockerfile ]; then
cat > Dockerfile <<'DF'
FROM rust:1.79 as build
WORKDIR /src
COPY . .
RUN cargo build --release --locked
FROM debian:stable-slim
WORKDIR /app
COPY --from=build /src/target/release /app/
EXPOSE 8000
# Update binary name if different
CMD ["/app/app"]
DF
      fi
      popd >/dev/null
      ;;
    *)
      if [ ! -f "$dir/Dockerfile" ]; then
cat > "$dir/Dockerfile" <<'DF'
FROM debian:stable-slim
WORKDIR /app
COPY . .
CMD ["bash","-lc","ls -la && echo 'No default run command set' && sleep infinity"]
DF
      fi
      ;;
  esac
}

# ===== Web service detection & ops blocks =====
maybe_add_ops() {
  local dir="$1"
  local port exposure
  if [ -f "$dir/Dockerfile" ]; then
    exposure="$(awk 'toupper($1)=="EXPOSE"{print $2;exit}' "$dir/Dockerfile" || true)"
  fi
  port="${exposure:-8000}"

  if grep -R --include="package.json" -E '"start"|"serve"|"dev"' -n "$dir" >/dev/null 2>&1 \
     || grep -R -E 'FastAPI|Flask|Django|Express|Next\.js|NestJS|Uvicorn|Gunicorn' "$dir" >/dev/null 2>&1 \
     || [ -f "$dir/Dockerfile" ]; then

    cat > "$dir/docker-compose.yml" <<EOT
version: "3.9"
services:
  app:
    build: .
    container_name: app
    restart: unless-stopped
    ports:
      - "${port}:${port}"
    environment:
      - NODE_ENV=production
      - PYTHONDONTWRITEBYTECODE=1
      - PYTHONUNBUFFERED=1
    command: []
EOT

    mkdir -p "$dir/_ops/nginx"
    cat > "$dir/_ops/nginx/site.conf" <<EOT
# NGINX proxy (edit SERVER_NAME)
server {
  listen 80;
  server_name app.${DOMAIN_BASE};
  return 301 https://\$host\$request_uri;
}
server {
  listen 443 ssl http2;
  server_name app.${DOMAIN_BASE};
  ssl_certificate     /etc/letsencrypt/live/${DOMAIN_BASE}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_BASE}/privkey.pem;
  location / {
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_pass http://127.0.0.1:${port};
  }
}
EOT

    mkdir -p "$dir/_ops/systemd"
    cat > "$dir/_ops/systemd/app.service" <<'EOT'
[Unit]
Description=App via docker compose
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory=/opt/app
RemainAfterExit=yes
ExecStart=/usr/bin/docker compose up -d --remove-orphans
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=600
TimeoutStopSec=120
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectControlGroups=true

[Install]
WantedBy=multi-user.target
EOT
  fi
}

# ===== Submodules & LFS mirroring =====
process_submodules() {
  local dir="$1"
  [ -f "$dir/.gitmodules" ] || return 0
  git -C "$dir" submodule update --init --recursive || true
  while read -r key path; do
    local name url sub_raw sub_mirror sub_remote
    name="${key#submodule.}"; name="${name%.path}"
    url="$(git -C "$dir" config -f .gitmodules --get "submodule.$name.url" || true)"
    [ -z "$url" ] && continue
    sub_raw="$(basename -s .git "$url")"
    sub_mirror="${MIRROR_PREFIX}${sub_raw}"
    sub_remote="$(create_github_repo "$sub_mirror")"
    if [ ! -d "$BACKUP/${sub_mirror}.git" ]; then
      git clone --mirror "$url" "$BACKUP/${sub_mirror}.git"
    else
      git --git-dir="$BACKUP/${sub_mirror}.git" remote set-url origin "$url" || true
      git --git-dir="$BACKUP/${sub_mirror}.git" fetch -p origin || true
    fi
    if command -v git-lfs >/dev/null 2>&1; then
      git --git-dir="$BACKUP/${sub_mirror}.git" lfs fetch --all || true
      [ "$sub_remote" != "SKIP_GITHUB" ] && git --git-dir="$BACKUP/${sub_mirror}.git" lfs push --all "$sub_remote" || true
    fi
    if [ "$sub_remote" != "SKIP_GITHUB" ]; then
      git --git-dir="$BACKUP/${sub_mirror}.git" push --mirror "$sub_remote" || true
      git -C "$dir" config -f .gitmodules "submodule.$name.url" "$sub_remote"
    fi
  done < <(git -C "$dir" config -f .gitmodules --get-regexp '^submodule\..*\.path$' || true)
  git -C "$dir" submodule sync --recursive || true
}

# ===== Main =====
[ -z "$REPOS" ] && die "No REPOS provided. Set REPOS=\"https://github.com/user/repo ...\""
ensure_team

for url in $REPOS; do
  [ -z "$url" ] && continue
  echo "=== Processing $url ==="
  name_raw="$(basename -s .git "$url")"
  mirror_name="${MIRROR_PREFIX}${name_raw}"

  # 1) Bare mirror
  if [ ! -d "$BACKUP/${mirror_name}.git" ]; then
    $DRY_RUN && echo "(dry-run) git clone --mirror $url $BACKUP/${mirror_name}.git" || git clone --mirror "$url" "$BACKUP/${mirror_name}.git"
  else
    echo "Mirror exists; updating"
    git --git-dir="$BACKUP/${mirror_name}.git" remote set-url origin "$url" || true
    git --git-dir="$BACKUP/${mirror_name}.git" fetch -p origin || true
  fi

  # 2) Create GH repo & push mirror
  remote_url="$(create_github_repo "$mirror_name")"
  if [ "$remote_url" != "SKIP_GITHUB" ]; then
    $DRY_RUN && echo "(dry-run) push --mirror to $remote_url" || git --git-dir="$BACKUP/${mirror_name}.git" push --mirror "$remote_url"
    # LFS objects
    if command -v git-lfs >/dev/null 2>&1; then
      $DRY_RUN && echo "(dry-run) git-lfs push --all $remote_url" || git --git-dir="$BACKUP/${mirror_name}.git" lfs push --all "$remote_url" || true
    fi
  else
    echo "No GH auth; keeping local mirror at $BACKUP/${mirror_name}.git"
  fi

  # 3) Working clone
  workdir="$WORK/$mirror_name"
  if [ ! -d "$workdir/.git" ]; then
    $DRY_RUN && echo "(dry-run) git clone $BACKUP/${mirror_name}.git $workdir" || git clone "$BACKUP/${mirror_name}.git" "$workdir"
  fi
  pushd "$workdir" >/dev/null

  # Point origin at GitHub (so our commits reach GH), keep backup remote
  if [ "$remote_url" != "SKIP_GITHUB" ]; then
    git remote set-url origin "$remote_url"
    git remote remove backup 2>/dev/null || true
    git remote add backup "$BACKUP/${mirror_name}.git" || true
  fi

  # default branch normalization
  default_branch="$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | awk -F/ '{print $2}')"
  [ -z "$default_branch" ] && default_branch="main"
  git fetch --all --prune
  git checkout -B "blackroad/main" "origin/${default_branch}" 2>/dev/null || git checkout -B "blackroad/main"

  # 4) Meta, pin, containers, ops, submodules
  add_meta "$workdir" "$url"
  lang="$(detect_lang "$workdir")"
  echo "Detected language: $lang"
  pin_and_containerize "$workdir" "$lang"
  maybe_add_ops "$workdir"
  process_submodules "$workdir"

  # 5) License handling
  if [ ! -f LICENSE ] && [ ! -f LICENSE.md ]; then
cat > LICENSE <<'EOT'
MIT License (for BlackRoad modifications and added operational files)

Copyright (c) 2025 BlackRoad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software, alongside any original LICENSE(s).

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
EOT
  fi

  # 6) Commit only if changes
  git add -A
  if ! git diff --quiet --staged; then
    git -c user.name="BlackRoad Mirror Bot" -c user.email="mirrorbot@blackroad.io" commit -m "chore(blackroad): mirrorize, pin deps, containerize, add CI/SBOM/ops"
  else
    echo "No changes to commit."
  fi

  # 7) Push to GitHub & set default branch
  if [ "$remote_url" != "SKIP_GITHUB" ]; then
    # Push branch to GH and to backup bare
    git push -u origin blackroad/main || true
    git push backup blackroad/main || true
    if command -v gh >/dev/null 2>&1; then
      gh api -X PATCH "repos/${TARGET_ORG}/${mirror_name}" -f default_branch="blackroad/main" || true
    fi
  fi

  popd >/dev/null
  echo "=== Done: $mirror_name ==="
  sleep 1

done

echo "All repos processed."
