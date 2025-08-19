#!/usr/bin/env bash
# BIN: mirrorize_tiktoken.sh
# Purpose: Mirror openai/tiktoken into $ORG and add CI/security scaffolding.
set -euo pipefail

: "${ORG:?Set ORG to your GitHub org, e.g., export ORG=blackboxprogramming}"
REPO="tiktoken"
UPSTREAM="openai/$REPO"
VISIBILITY="${VISIBILITY:-private}"
DESCRIPTION="Mirror of openai/tiktoken — fast BPE tokenizer (Python+Rust). MIT-licensed. Maintained by $ORG."

command -v gh >/dev/null || { echo "Install GitHub CLI: https://cli.github.com"; exit 1; }
command -v git >/dev/null || { echo "git required"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Run: gh auth login"; exit 1; }

workdir="$(mktemp -d)"; trap 'rm -rf "$workdir"' EXIT
cd "$workdir"

# 1) Create an independent mirror (not a fork)
git clone --mirror "https://github.com/${UPSTREAM}.git"
cd "${REPO}.git"
if ! gh repo view "${ORG}/${REPO}" >/dev/null 2>&1; then
  gh repo create "${ORG}/${REPO}" --${VISIBILITY} --description "$DESCRIPTION" --disable-wiki --disable-issues
fi
git remote set-url --push origin "git@github.com:${ORG}/${REPO}.git" || true
git push --mirror "git@github.com:${ORG}/${REPO}.git"

# 2) Rehydrate a working copy
cd ..
git clone "git@github.com:${ORG}/${REPO}.git"
cd "${REPO}"

git switch -c blackroad/hardening

# 3) Add CI (Python + Rust toolchain), CodeQL, Dependabot, SECURITY, example
mkdir -p .github/workflows .github/ISSUE_TEMPLATE

cat > .github/workflows/ci.yml <<'YAML'
name: CI
on:
  push:
    branches: [ main, master, "**" ]
  pull_request:
permissions:
  contents: read
  security-events: write
jobs:
  build-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.9","3.10","3.11","3.12"]
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      - run: pip install -U pip build pytest
      - run: python -m build
      - run: pip install -e .
      - run: pytest -q
  codeql:
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: python
      - uses: github/codeql-action/analyze@v3
YAML

cat > .github/dependabot.yml <<'YAML'
version: 2
updates:
  - package-ecosystem: "pip"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "cargo"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }
YAML

cat > SECURITY.md <<'MD'
# Security Policy
Please report vulnerabilities privately via GitHub Security Advisories.
Do not open public issues for security reports.
MD

mkdir -p examples
cat > examples/token_count.py <<'PY'
import sys, tiktoken
enc = tiktoken.encoding_for_model("gpt-4o")
text = sys.stdin.read() if not sys.stdin.isatty() else "Hello from BlackRoad"
print(len(enc.encode(text)))
PY

cat > requirements-dev.txt <<'TXT'
pytest
build
wheel
TXT

# Optional CODEOWNERS (set to your org or team)
mkdir -p .github
cat > .github/CODEOWNERS <<'EOC'
* @$ORG
EOC

git add -A
git commit -m "chore: add CI, CodeQL, Dependabot, SECURITY, example"
git push -u origin HEAD

# 4) Open a PR
gh pr create --title "BlackRoad hardening: CI + security + example" \
  --body "Adds CI (Python + Rust toolchain), CodeQL, Dependabot, SECURITY.md, and a minimal token_count example."
echo "Done. Review PR on: https://github.com/${ORG}/${REPO}/pulls"
