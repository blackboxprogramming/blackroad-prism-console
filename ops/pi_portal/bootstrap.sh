#!/usr/bin/env bash
# <!-- FILE: /ops/pi_portal/bootstrap.sh -->
set -euo pipefail

ROOT="${PORTAL_ROOT:-/home/pi/portal}"

mkdir -p "${ROOT}/bin" "${ROOT}/psbts" "${ROOT}/reports" "${ROOT}/logs" "${ROOT}/configs"

need_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
}

need_cmd qrencode
need_cmd zbarimg
need_cmd sha256sum
need_cmd jq

cat > "${ROOT}/bin/psbt-to-qr-robust" <<'EQR2'
#!/usr/bin/env bash
set -euo pipefail
FILE="${1:?usage: psbt-to-qr-robust <psbt_file> [out-prefix] [chunk-size] }"
PREFIX="${2:-${FILE}}"
SEG="${3:-2200}"
B64="$(tr -d '\n\r' < "${FILE}")"
SHA="$(printf "%s" "${B64}" | sha256sum | awk '{print $1}')"
LEN=${#B64}
PARTS=$(( (LEN + SEG - 1) / SEG ))
MAN="${PREFIX}.qrmanifest.json"

jq -n --arg name "$(basename "${FILE}")" --arg b64_sha256 "${SHA}" \
      --argjson len "${LEN}" --argjson seg "${SEG}" --argjson parts "${PARTS}" \
      --arg created "$(date -u +%FT%TZ)" \
      '{name:$name, algo:"sha256(b64)", len:$len, chunk:$seg, parts:$parts, created:$created, payload:"PSBT"}' > "${MAN}"

if (( PARTS == 1 )); then
  OUT="${PREFIX}.qr.png"
  qrencode -o "${OUT}" "PSBT1/1:${SHA}:${B64}"
  echo "QR: ${OUT}"
else
  for i in $(seq 1 ${PARTS}); do
    s=$(( (i-1)*SEG ))
    chunk="${B64:$s:$SEG}"
    OUT="${PREFIX}.qr.part${i}_of_${PARTS}.png"
    qrencode -o "${OUT}" "PSBT${i}/${PARTS}:${SHA}:${chunk}"
    echo "QR ${i}/${PARTS}: ${OUT}"
  done
  echo "MANIFEST: ${MAN}"
fi
EQR2
chmod +x "${ROOT}/bin/psbt-to-qr-robust"

cat > "${ROOT}/bin/qr-to-psbt-robust" <<'DQR2'
#!/usr/bin/env bash
set -euo pipefail
OUT="${1:?usage: qr-to-psbt-robust <out.psbt> <img1.png> [img2.png ...] }"
shift
declare -A map
want=0
sig=""
for img in "$@"; do
  txt="$(zbarimg --raw "${img}" 2>/dev/null | tr -d '\r\n')"
  [[ -z "${txt}" ]] && { echo "no QR payload in ${img}" >&2; exit 2; }
  if [[ "${txt}" =~ ^PSBT([0-9]+)/([0-9]+):([0-9a-fA-F]{64}):(.*)$ ]]; then
    idx="${BASH_REMATCH[1]}"
    tot="${BASH_REMATCH[2]}"
    sh="${BASH_REMATCH[3]}"
    payload="${BASH_REMATCH[4]}"
    map["${idx}"]="${payload}"
    sig="${sh}"
    want="${tot}"
    echo "read part ${idx}/${tot}"
  elif [[ "${txt}" =~ ^PSBT1/1:([0-9a-fA-F]{64}):(.*)$ ]]; then
    sig="${BASH_REMATCH[1]}"
    payload="${BASH_REMATCH[2]}"
    want=1
    map["1"]="${payload}"
    echo "read single-part"
  else
    echo "unrecognized QR format in ${img}" >&2
    exit 3
  fi
done
if (( want == 0 )); then
  echo "no PSBT parts found" >&2
  exit 4
fi
assembled=""
for ((i=1;i<=want;i++)); do
  part="${map[$i]:-}"
  [[ -n "${part}" ]] || { echo "missing part ${i}/${want}" >&2; exit 5; }
  assembled+="${part}"
done
sha_calc="$(printf "%s" "${assembled}" | sha256sum | awk '{print $1}')"
if [[ "${sha_calc}" != "${sig}" ]]; then
  echo "checksum mismatch: expected ${sig} got ${sha_calc}" >&2
  exit 6
fi
printf "%s" "${assembled}" > "${OUT}"
echo "PSBT restored: ${OUT} (sha256(b64)=${sha_calc})"
DQR2
chmod +x "${ROOT}/bin/qr-to-psbt-robust"

cat > "${ROOT}/bin/offline-joiner.sh" <<'OFFJ'
#!/usr/bin/env bash
set -euo pipefail
OUT="${1:?out.psbt}"
shift
declare -A map
want=0
sig=""
for img in "$@"; do
  txt="$(zbarimg --raw "${img}" 2>/dev/null | tr -d '\r\n')"
  [[ -z "${txt}" ]] && { echo "no QR payload: ${img}" >&2; exit 2; }
  if [[ "${txt}" =~ ^PSBT([0-9]+)/([0-9]+):([0-9a-fA-F]{64}):(.*)$ ]]; then
    idx="${BASH_REMATCH[1]}"
    tot="${BASH_REMATCH[2]}"
    sh="${BASH_REMATCH[3]}"
    payload="${BASH_REMATCH[4]}"
    map["${idx}"]="${payload}"
    sig="${sh}"
    want="${tot}"
    echo "part ${idx}/${tot}"
  elif [[ "${txt}" =~ ^PSBT1/1:([0-9a-fA-F]{64}):(.*)$ ]]; then
    sig="${BASH_REMATCH[1]}"
    payload="${BASH_REMATCH[2]}"
    want=1
    map["1"]="${payload}"
    echo "single"
  else
    echo "bad format: ${img}" >&2
    exit 3
  fi
done
assembled=""
for ((i=1;i<=want;i++)); do
  [[ -n "${map[$i]:-}" ]] || { echo "missing part ${i}/${want}" >&2; exit 4; }
  assembled+="${map[$i]}"
done
sha_calc="$(printf "%s" "${assembled}" | sha256sum | awk '{print $1}')"
if [[ "${sha_calc}" != "${sig}" ]]; then
  echo "checksum mismatch" >&2
  exit 5
fi
printf "%s" "${assembled}" > "${OUT}"
echo "OK ${OUT} sha256(b64)=${sha_calc}"
OFFJ
chmod +x "${ROOT}/bin/offline-joiner.sh"

echo "QR ROBUST: psbt-to-qr-robust ${ROOT}/psbts/LABEL.psbt"
echo "           qr-to-psbt-robust ${ROOT}/psbts/LABEL.signed.psbt <imgs...>"
echo "OFFLINE    copy ${ROOT}/bin/offline-joiner.sh to signer box"

echo "Checking Caddy availability"
if ! command -v caddy >/dev/null 2>&1; then
  echo "Caddy not found. Install with: sudo apt-get install -y caddy" >&2
fi

sudo mkdir -p /etc/caddy
sudo bash -c 'cat > /etc/caddy/Caddyfile' <<'CAD'
:8099 {
    basicauth /* {
        user1 JDJhJDEwJGt0b0Q2b2J6bG1p...
    }
    reverse_proxy 127.0.0.1:8088
}
CAD

cat > "${ROOT}/bin/caddy-setpass" <<'CSP'
#!/usr/bin/env bash
set -euo pipefail
USER="${1:?user}"
PASS="${2:?pass}"
HASH="$(caddy hash-password --plaintext "${PASS}")"
sudo sed -i "s|user1 .*|${USER} ${HASH}|g" /etc/caddy/Caddyfile
sudo systemctl restart caddy
echo "Basic Auth set for ${USER}"
CSP
chmod +x "${ROOT}/bin/caddy-setpass"

sudo mkdir -p /var/lib/tor/portal-health-auth
sudo chown -R debian-tor:debian-tor /var/lib/tor/portal-health-auth
sudo chmod 700 /var/lib/tor/portal-health-auth
sudo mkdir -p /etc/tor/torrc.d
sudo bash -c 'cat > /etc/tor/torrc.d/portal-health-auth.conf' <<'TORC2'
HiddenServiceDir /var/lib/tor/portal-health-auth
HiddenServiceVersion 3
HiddenServicePort 80 127.0.0.1:8099
TORC2
if ! grep -q "^%include /etc/tor/torrc.d/*" /etc/tor/torrc; then
  echo "%include /etc/tor/torrc.d/*" | sudo tee -a /etc/tor/torrc >/dev/null
fi
sudo systemctl restart tor

cat > "${ROOT}/bin/portal-health-auth" <<'PHA'
#!/usr/bin/env bash
set -euo pipefail
ROOT="${PORTAL_ROOT:-/home/pi/portal}"
HS="/var/lib/tor/portal-health-auth/hostname"
[ -s "${HS}" ] || { echo "Tor HS not ready; systemctl status tor" >&2; exit 2; }
ONION="$(sudo cat "${HS}")"
if ! ss -lnt | grep -q ':8088'; then
  if [[ -x "${ROOT}/bin/portal-static" ]]; then
    "${ROOT}/bin/portal-static" 127.0.0.1:8088 >/dev/null 2>&1 &
    sleep 1
  else
    echo "portal-static not running and ${ROOT}/bin/portal-static missing" >&2
    exit 3
  fi
fi
sudo systemctl enable --now caddy >/dev/null 2>&1 || true
echo "Health (Basic-Auth) onion: http://${ONION}/"
echo "Set credentials: caddy-setpass <user> <pass>"
PHA
chmod +x "${ROOT}/bin/portal-health-auth"

echo "Encode robust QR:  psbt-to-qr-robust ${ROOT}/psbts/LABEL.psbt"
echo "Join robust QR:    qr-to-psbt-robust ${ROOT}/psbts/LABEL.signed.psbt imgs..."
echo "Offline joiner:    copy ${ROOT}/bin/offline-joiner.sh to signer box"
echo "Health via Tor+BA: portal-health && portal-health-auth"
