#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage: $(basename "$0") DOMAIN [PATH ...]

Hit a set of paths on the given DOMAIN requesting Brotli/Gzip, capture
Content-Encoding responses, and summarise the results.

Arguments:
  DOMAIN       Base domain (https://example.com). The scheme is required.
  PATH         Optional list of path suffixes to probe. Defaults to
               /, /index.html, /assets/app.js, /assets/app.css.

Environment:
  TMP_FILE     Override the output file used to store the captured sample.
  ACCESS_LOG   If set, parse the given Nginx access log for content-encoding
               counts using the log_format snippet documented in nginx/README.md.

Outputs:
  - Sorted sample written to TMP_FILE (default: /tmp/enc-sample.txt).
  - Summary counts for all endpoints and HTML-only endpoints.
  - Optional verification that HTML endpoints return br/gzip.
  - Optional aggregation from ACCESS_LOG (if provided).
USAGE
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 1
fi

domain="$1"
shift

if [[ $domain != http://* && $domain != https://* ]]; then
  echo "DOMAIN must include scheme (http:// or https://): $domain" >&2
  exit 1
fi

if [[ $# -gt 0 ]]; then
  mapfile -t paths < <(printf '%s\n' "$@")
else
  paths=("/" "/index.html" "/assets/app.js" "/assets/app.css")
fi

sample_file=${TMP_FILE:-/tmp/enc-sample.txt}
html_tmp=$(mktemp)
trap 'rm -f "$html_tmp"' EXIT

echo "# Probing content-encoding for ${domain}" >&2
tmp_output=$(mktemp)
trap 'rm -f "$tmp_output" "$html_tmp"' EXIT

for p in "${paths[@]}"; do
  curl -sSI --http2 -H 'Accept-Encoding: br,gzip' "${domain%/}$p" \
    | awk -v p="$p" 'BEGIN{IGNORECASE=1}/^Content-Encoding:/{print p, $0}'
done \
  | sort \
  | tee "$tmp_output" >&2

mv "$tmp_output" "$sample_file"
echo "Sample captured to $sample_file" >&2

echo "# Content-Encoding counts" >&2
awk '{print $2, $3}' "$sample_file" | sort | uniq -c | sort -nr

awk 'BEGIN{IGNORECASE=1}!($1 ~ /\.(js|css)(\?|$)/)' "$sample_file" > "$html_tmp"
if [[ -s $html_tmp ]]; then
  echo "# HTML-like endpoint counts" >&2
  awk '{print $2, $3}' "$html_tmp" | sort | uniq -c | sort -nr
else
  echo "# No HTML-like endpoints detected in sample" >&2
fi

fail=0
while IFS= read -r line; do
  path=$(awk '{print $1}' <<<"$line")
  ce=$(awk '{print tolower($3)}' <<<"$line" | tr -d '\r')
  if [[ -z $ce ]]; then
    ce="none"
  fi
  if [[ $ce != "br" && $ce != "gzip" ]]; then
    echo "FAIL $path (got: $ce)" >&2
    fail=1
  fi
done < "$html_tmp"

if [[ $fail -eq 0 ]]; then
  echo "OK: compression on HTML endpoints" >&2
else
  echo "Compression check failed" >&2
fi

if [[ -n ${ACCESS_LOG:-} && -r ${ACCESS_LOG:-} ]]; then
  echo "# Aggregated encodings from ${ACCESS_LOG}" >&2
  awk '{
    uri=$(NF-1); enc=$NF;
    if (enc=="-") enc="none";
    key=uri"|"enc; c[key]++;
  } END {
    for (k in c) {
      split(k, parts, "|");
      printf "%d %s %s\n", c[k], parts[1], parts[2];
    }
  }' "$ACCESS_LOG" | sort -nr
elif [[ -n ${ACCESS_LOG:-} ]]; then
  echo "ACCESS_LOG specified but unreadable: ${ACCESS_LOG}" >&2
fi

exit $fail
