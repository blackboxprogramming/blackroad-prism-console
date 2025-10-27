#!/usr/bin/env bash
set -euo pipefail

WEBDAV_URL=${WEBDAV_URL:-"http://192.168.4.55:8080/"}
JETSON_HOST=${JETSON_HOST:-"jetson@jetson.local"}
PI_HOSTS_DEFAULT=("lucidia@pi" "alice@raspberrypi")
EXTRA_HOSTS=()

usage() {
  cat <<'USAGE'
Usage: webdav_device_check.sh [options] [additional_host ...]

Checks the Working Copy WebDAV endpoint and verifies SSH connectivity to the
Jetson companion plus Raspberry Pi hosts.

Options:
  --webdav-url <url>   Override the WebDAV endpoint URL (env: WEBDAV_URL)
  --jetson <host>      Override the Jetson SSH target (env: JETSON_HOST)
  --pi-host <host>     Add/override a Raspberry Pi SSH target (repeatable)
  -h, --help           Show this help text

Additional positional arguments are treated as extra SSH targets.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --webdav-url)
      if [[ $# -lt 2 ]]; then
        echo "[ERROR] --webdav-url requires a value" >&2
        exit 1
      fi
      WEBDAV_URL=$2
      shift 2
      ;;
    --jetson)
      if [[ $# -lt 2 ]]; then
        echo "[ERROR] --jetson requires a value" >&2
        exit 1
      fi
      JETSON_HOST=$2
      shift 2
      ;;
    --pi-host)
      if [[ $# -lt 2 ]]; then
        echo "[ERROR] --pi-host requires a value" >&2
        exit 1
      fi
      EXTRA_HOSTS+=("$2")
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      EXTRA_HOSTS+=("$1")
      shift
      ;;
  esac
done

commands=(curl ping ssh)
missing=0
for cmd in "${commands[@]}"; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ERROR] Required dependency '$cmd' is not installed" >&2
    missing=1
  fi
done

if [[ $missing -ne 0 ]]; then
  exit 1
fi

status=0

printf '\n== WebDAV endpoint check ==\n'
WEBDAV_HOST=${WEBDAV_URL#*://}
WEBDAV_HOST=${WEBDAV_HOST%%/*}
if [[ -z "$WEBDAV_HOST" ]]; then
  echo "[WARN] Could not determine host from WEBDAV_URL ($WEBDAV_URL)"
  status=1
else
  if ping -c 1 -W 2 "$WEBDAV_HOST" >/dev/null 2>&1; then
    echo "[OK] WebDAV host $WEBDAV_HOST responded to ping"
  else
    echo "[WARN] WebDAV host $WEBDAV_HOST did not respond to ping"
    status=1
  fi
fi

if curl -fsS -o /dev/null -X PROPFIND "$WEBDAV_URL"; then
  echo "[OK] WebDAV endpoint $WEBDAV_URL responded to PROPFIND"
else
  echo "[WARN] WebDAV endpoint $WEBDAV_URL did not respond successfully"
  status=1
fi

ALL_HOSTS=("$JETSON_HOST")
if [[ ${#EXTRA_HOSTS[@]} -gt 0 ]]; then
  ALL_HOSTS+=("${EXTRA_HOSTS[@]}")
else
  ALL_HOSTS+=("${PI_HOSTS_DEFAULT[@]}")
fi

printf '\n== Device connectivity checks ==\n'
for host in "${ALL_HOSTS[@]}"; do
  echo "\n--- $host ---"
  target=${host#*@}
  if ping -c 1 -W 2 "$target" >/dev/null 2>&1; then
    echo "[OK] Host $target responded to ping"
  else
    echo "[WARN] Host $target did not respond to ping"
    status=1
  fi

  if ssh -o BatchMode=yes -o ConnectTimeout=5 "$host" exit >/dev/null 2>&1; then
    echo "[OK] SSH connectivity to $host confirmed"
  else
    echo "[WARN] Could not establish passwordless SSH session to $host"
    status=1
  fi

done

printf '\nSummary: '
if [[ $status -eq 0 ]]; then
  echo "all checks passed"
else
  echo "review warnings above"
fi

exit $status
