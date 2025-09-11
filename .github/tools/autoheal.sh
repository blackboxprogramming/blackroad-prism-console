#!/usr/bin/env bash
set -euo pipefail

# Track whether this script changes anything
changed=false
git_add() { git add "$@" && changed=true; }

# Step 1: ensure a Node project exists with basic scripts
if [ ! -f package.json ]; then
  npm init -y >/dev/null 2>&1 || true
  git_add package.json
fi

node - <<'JS'
const fs = require("fs");
const p = "package.json";
const j = JSON.parse(fs.readFileSync(p, "utf8"));
j.scripts = j.scripts || {};
j.scripts.test   ||= "echo \"No tests specified\" && exit 0";
j.scripts.lint   ||= "eslint . --ext .js,.mjs,.cjs";
j.scripts.format ||= "prettier -w .";
fs.writeFileSync(p, JSON.stringify(j, null, 2));
JS
git_add package.json || true

# Step 2: add baseline lint/format configs
[ -f .prettierrc.json ] || {
  echo '{ "printWidth": 100, "singleQuote": true, "trailingComma": "es5" }' > .prettierrc.json
  git_add .prettierrc.json
}

[ -f eslint.config.js ] || {
  echo 'export default [];' > eslint.config.js
  git_add eslint.config.js
}

# Step 3: install tools and apply fixes (best effort)
npm i -D prettier eslint eslint-config-prettier >/dev/null 2>&1 || true
npx --yes prettier -w .  >/dev/null 2>&1 || true
npx --yes eslint . --ext .js,.mjs,.cjs --fix >/dev/null 2>&1 || true

# Stage any new changes from format/fix
git diff --quiet || { git add -A && changed=true; }

# Step 4: commit if anything changed
if $changed; then
  git commit -m "chore(auto-heal): baseline configs + prettier/eslint --fix" || true
  echo "committed=1" >> "$GITHUB_OUTPUT"
else
  echo "committed=0" >> "$GITHUB_OUTPUT"
fi
