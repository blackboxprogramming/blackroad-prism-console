#!/usr/bin/env bash
set -euo pipefail
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"
BOT_USER="${BOT_USER:-blackroad-bot}"
BOT_EMAIL="${BOT_USER}@users.noreply.github.com"
git config user.name  "$BOT_USER" || true
git config user.email "$BOT_EMAIL" || true
changed=false; add(){ git add "$@" && changed=true; }

# Node baseline
if [ ! -f package.json ]; then npm init -y >/dev/null 2>&1 || true; add package.json; fi
node - <<'JS' && changed=true || true
const fs=require("fs"), p="package.json";
const j=JSON.parse(fs.readFileSync(p,"utf8"));
j.scripts=j.scripts||{};
j.scripts.test   ||= "echo \"No tests specified\" && exit 0";
j.scripts.lint   ||= "eslint . --ext .js,.mjs,.cjs";
j.scripts.format ||= "prettier -w .";
fs.writeFileSync(p, JSON.stringify(j,null,2));
JS
add package.json || true
[ -f .prettierrc.json ] || { echo '{ "printWidth": 100, "singleQuote": true, "trailingComma": "es5" }' > .prettierrc.json; add .prettierrc.json; }
[ -f eslint.config.js ] || { cat > eslint.config.js <<'JS'
import js from "@eslint/js"; import prettier from "eslint-config-prettier";
export default [ js.configs.recommended, prettier, { ignores:["node_modules/","dist/","build/",".github/",".tools/","public/vendor/"],
  rules:{ "no-unused-vars":["warn",{ "argsIgnorePattern":"^_", "varsIgnorePattern":"^_" }], "no-undef":"warn" } } ];
JS
add eslint.config.js; }

# Minimal HTML
mkdir -p apps/quantum
[ -f apps/quantum/ternary_consciousness_v3.html ] || { cat > apps/quantum/ternary_consciousness_v3.html <<'HTML'
<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Ternary Quantum Consciousness Framework</title><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body><h1>🧠 Ternary Quantum Consciousness Framework</h1><p>Placeholder.</p></body></html>
HTML
add apps/quantum/ternary_consciousness_v3.html; }

# CodeQL config
mkdir -p .github/codeql
[ -f .github/codeql/config.yml ] || { cat > .github/codeql/config.yml <<'YML'
name: CodeQL JS config
paths: [ ".", "apps/quantum" ]
paths-ignore: [ "node_modules","dist","build","public/vendor",".tools",".github" ]
YML
add .github/codeql/config.yml; }

# Basic docs
[ -f README.md ] || { printf "# %s\n\nAutomated baseline present.\n" "${PWD##*/}" > README.md; add README.md; }
[ -f .gitignore ] || { printf "node_modules/\ndist/\nbuild/\ncoverage/\n.env\n.DS_Store\n" > .gitignore; add .gitignore; }

# Format & lint (best-effort)
npm i -D prettier eslint eslint-config-prettier >/dev/null 2>&1 || true
npx --yes prettier -w . >/dev/null 2>&1 || true
npx --yes eslint . --ext .js,.mjs,.cjs --fix >/dev/null 2>&1 || true
git diff --quiet || { git add -A && changed=true; }

if $changed; then git commit -m "chore(justfix): baseline configs & format/lint fixes" || true; fi
