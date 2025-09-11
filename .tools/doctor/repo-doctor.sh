#!/usr/bin/env bash
set -euo pipefail
OUT="${1:-repo-doctor-report.md}"
touch "$OUT"

section(){ echo -e "\n## $1\n" >> "$OUT"; }
line(){ echo "- $1" >> "$OUT"; }

echo "# Repo Doctor Report" > "$OUT"
echo "_$(date -u '+%Y-%m-%d %H:%M UTC')_" >> "$OUT"

# 1) Tree sanity
section "Tree Sanity"
[ -f apps/quantum/ternary_consciousness_v3.html ] && line "✅ v3 HTML present" || line "❌ v3 HTML missing"
[ -f .github/workflows/deploy-quantum.yml ] && line "✅ Deploy workflow present" || line "❌ Deploy workflow missing"

# 2) HTML validity (tidy if available)
section "HTML Validity"
if command -v tidy >/dev/null 2>&1; then
  tidy -qe apps/quantum/ternary_consciousness_v3.html 2>tidy.log || true
  errs=$(grep -ci "Error:" tidy.log || true)
  line "tidy errors: ${errs:-0} (see artifact tidy.log)"
else
  line "ℹ️ tidy not installed on runner; skipped"
fi

# 3) JS quick syntax
section "JavaScript Syntax"
errs=0
while IFS= read -r f; do
  node -c "$f" >/dev/null 2>&1 || { echo "❌ $f" >> "$OUT"; errs=$((errs+1)); }
done < <(git ls-files '*.js')
[ "$errs" = "0" ] && line "✅ no syntax errors detected"

# 4) License headers (sample check)
section "License Headers (sample)"
miss=0
while IFS= read -r f; do
  grep -q "Copyright" "$f" || miss=$((miss+1))
done < <(git ls-files '*.js' '*.yml' '*.yaml' '*.html')
line "Files without explicit copyright: ${miss}"

# 5) Big files
section "Large Files (>5MB tracked)"
big=$(git ls-files -s | awk '{print $4}' | xargs -I{} -- du -m {} 2>/dev/null | awk '$1>5{print $2" ("$1"MB)"}')
[ -n "$big" ] && echo "$big" | sed 's/^/- /' >> "$OUT" || line "✅ none"

# 6) Duplicate basenames
section "Duplicate Filenames (basename collisions)"
dups=$(git ls-files | awk -F/ '{print $NF}' | sort | uniq -d)
[ -n "$dups" ] && echo "$dups" | sed 's/^/- /' >> "$OUT" || line "✅ none"

# 7) Orphan workflows (referencing non-existent paths)
section "Orphan Workflows inputs"
for wf in .github/workflows/*.yml; do
  grep -q "apps/quantum/" "$wf" && [ ! -d apps/quantum ] && line "❌ $wf references apps/quantum/ but directory missing"
done

# 8) Badges present
section "README Badges"
if grep -q "BADGES START" apps/quantum/README.md 2>/dev/null; then
  line "✅ README badges block exists"
else
  line "⚠️ README badges not found in apps/quantum/README.md"
fi

# 9) Summary
section "Next Steps"
line "Review errors above. See artifacts for logs."
