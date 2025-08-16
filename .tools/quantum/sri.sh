#!/usr/bin/env bash
set -euo pipefail
HTML="apps/quantum/ternary_consciousness_v3.html"
CDN_CHARTJS="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"
CDN_MATHJS="https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.11.0/math.min.js"
LOCAL_CHARTJS="public/vendor/chartjs-3.9.1.min.js"
LOCAL_MATHJS="public/vendor/mathjs-11.11.0.min.js"

sri_local() { openssl dgst -sha384 -binary "$1" | openssl base64 -A | awk '{print "sha384-"$0}'; }
sri_remote(){ curl -fsSL "$1" | openssl dgst -sha384 -binary | openssl base64 -A | awk '{print "sha384-"$0}'; }

USE_CDN=false; grep -q "cdnjs.cloudflare.com" "$HTML" && USE_CDN=true
if $USE_CDN; then
  CHART_SRI="$(sri_remote "$CDN_CHARTJS")"
  MATH_SRI="$(sri_remote "$CDN_MATHJS")"
else
  [[ -f "$LOCAL_CHARTJS" && -f "$LOCAL_MATHJS" ]] || { echo "Missing local vendor files"; exit 1; }
  CHART_SRI="$(sri_local "$LOCAL_CHARTJS")"
  MATH_SRI="$(sri_local "$LOCAL_MATHJS")"
fi

perl -0777 -pe "s|<script\s+([^>]*?src=\\\"[^\\\"]*Chart\\.js/3\\.9\\.1/chart\\.min\\.js\\\"[^>]*)>|my \$a=\$1;\$a=~s/\\s+integrity=\\\"[^\\\"]*\\\"//g;\$a=~s/\\s+crossorigin=\\\"[^\\\"]*\\\"//g;\$a=~s/\\s+referrerpolicy=\\\"[^\\\"]*\\\"//g; '<script '.\$a.' integrity=\\\"$CHART_SRI\\\" crossorigin=\\\"anonymous\\\" referrerpolicy=\\\"no-referrer\\\">'|ge" -i "$HTML"
perl -0777 -pe "s|<script\s+([^>]*?src=\\\"[^\\\"]*mathjs/11\\.11\\.0/math\\.min\\.js\\\"[^>]*)>|my \$a=\$1;\$a=~s/\\s+integrity=\\\"[^\\\"]*\\\"//g;\$a=~s/\\s+crossorigin=\\\"[^\\\"]*\\\"//g;\$a=~s/\\s+referrerpolicy=\\\"[^\\\"]*\\\"//g; '<script '.\$a.' integrity=\\\"$MATH_SRI\\\" crossorigin=\\\"anonymous\\\" referrerpolicy=\\\"no-referrer\\\">'|ge" -i "$HTML"

git add "$HTML"
echo "SRI updated. Commit separately with: make commit && make push"
