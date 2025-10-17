#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: check_nginx_compression.sh [-f url_file] [url1 url2 ...]

Options:
  -f url_file   File containing one URL per line. Lines starting with # are ignored.

If no URLs are provided on the command line, the script expects `-f url_file`.
USAGE
}

url_file=""
declare -a urls=()

while getopts ":f:h" opt; do
  case "$opt" in
    f)
      url_file="$OPTARG"
      ;;
    h)
      usage
      exit 0
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      usage >&2
      exit 1
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      usage >&2
      exit 1
      ;;
  esac
done
shift $((OPTIND - 1))

if [[ -n "$url_file" ]]; then
  if [[ ! -f "$url_file" ]]; then
    echo "URL file '$url_file' not found." >&2
    exit 1
  fi
  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and blank lines
    [[ -z "${line// }" || "${line#\#}" != "$line" ]] && continue
    urls+=("$line")
  done < "$url_file"
fi

if [[ $# -gt 0 ]]; then
  urls+=("$@")
fi

if [[ ${#urls[@]} -eq 0 ]]; then
  echo "No URLs provided." >&2
  usage >&2
  exit 1
fi

temp_headers=""
cleanup() {
  [[ -n "$temp_headers" && -f "$temp_headers" ]] && rm -f "$temp_headers"
}
trap cleanup EXIT

for url in "${urls[@]}"; do
  echo "=============================="
  echo "URL: $url"

  temp_headers="$(mktemp)"

  if ! curl -sS --compressed -D "$temp_headers" -o /dev/null \
      --write-out "TLS Version: %{ssl_version}\nCipher: %{ssl_cipher}\nResponse Time: %{time_total}s\n" \
      -H "Accept-Encoding: gzip, br" "$url"; then
    echo "Request failed." >&2
    rm -f "$temp_headers"
    temp_headers=""
    continue
  fi

  status_line=$(head -n 1 "$temp_headers")
  echo "HTTP Status: $status_line"

  if ! grep -iE '^(content-encoding|content-type|content-length|cache-control|expires|etag|last-modified|vary|age|server):' \
    "$temp_headers" | sed 's/^/  /'; then
    echo "  (No caching or encoding headers were returned)"
  fi

  echo
  echo "TLS Version, Cipher, and response time above reflect the negotiated session."
  echo

  rm -f "$temp_headers"
  temp_headers=""

done

echo "=============================="
