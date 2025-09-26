#!/usr/bin/env bash
set -euo pipefail
changed=false; add(){ git add "$@" && changed=true; }
if [ ! -f package.json ]; then npm init -y >/dev/null 2>&1 || true; add package.json; fi
node - <<'JS' && changed=true || true
const fs=require("fs"), p="package.json";
const j=JSON.parse(fs.readFileSync(p,"utf8")); j.scripts=j.scripts||{};
j.scripts.test   ||= "echo \"No tests specified\" && exit 0";
j.scripts.lint   ||= "eslint . --ext .js,.mjs,.cjs";
j.scripts.format ||= "prettier -w .";
fs.writeFileSync(p, JSON.stringify(j,null,2));
JS
add package.json || true
[ -f .prettierrc.json ] || { echo '{ "printWidth": 100, "singleQuote": true, "trailingComma": "es5" }' > .prettierrc.json; add .prettierrc.json; }
[ -f eslint.config.js ] || { echo 'export default [];' > eslint.config.js; add eslint.config.js; }
npm i -D prettier eslint eslint-config-prettier >/dev/null 2>&1 || true
npx --yes prettier -w .  >/dev/null 2>&1 || true
npx --yes eslint . --ext .js,.mjs,.cjs --fix >/dev/null 2>&1 || true
git diff --quiet || { git add -A && changed=true; }
if $changed; then git commit -m "chore(auto-heal): baseline + prettier/eslint --fix" || true; echo "committed=1" >> "$GITHUB_OUTPUT"; else echo "committed=0" >> "$GITHUB_OUTPUT"; fi
