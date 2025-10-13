#!/usr/bin/env bash
set -euo pipefail

MQTT_URL=${MQTT_URL:-mqtt://localhost:1883}
MQTT_TOPIC_PREFIX=${MQTT_TOPIC_PREFIX:-system/heartbeat}
INTERVAL=${INTERVAL:-10}
HOSTNAME=${HEARTBEAT_HOSTNAME:-$(hostname)}
LOG_LEVEL=${LOG_LEVEL:-info}

parse_url() {
  local url="$1"
  local scheme hostport credentials host port

  if [[ "$url" != *"://"* ]]; then
    url="mqtt://$url"
  fi

  scheme="${url%%://*}"
  remainder="${url#*://}"

  if [[ "$remainder" == *"@"* ]]; then
    credentials="${remainder%@*}"
    hostport="${remainder#*@}"
  else
    credentials=""
    hostport="$remainder"
  fi

  if [[ "$credentials" == *":"* ]]; then
    MQTT_USER="${credentials%%:*}"
    MQTT_PASS="${credentials#*:}"
  elif [[ -n "$credentials" ]]; then
    MQTT_USER="$credentials"
    MQTT_PASS=""
  else
    MQTT_USER=""
    MQTT_PASS=""
  fi

  if [[ "$hostport" == *":"* ]]; then
    host="${hostport%%:*}"
    port="${hostport#*:}"
  else
    host="$hostport"
    if [[ "$scheme" == "mqtts" || "$scheme" == "ssl" || "$scheme" == "tls" ]]; then
      port="8883"
    else
      port="1883"
    fi
  fi

  MQTT_SCHEME="$scheme"
  MQTT_HOST="$host"
  MQTT_PORT="$port"
}

parse_url "$MQTT_URL"

MOSQ_ARGS=("-h" "$MQTT_HOST" "-p" "$MQTT_PORT")
if [[ -n "${MQTT_USER}" ]]; then
  MOSQ_ARGS+=("-u" "$MQTT_USER")
fi
if [[ -n "${MQTT_PASS}" ]]; then
  MOSQ_ARGS+=("-P" "$MQTT_PASS")
fi
if [[ "$MQTT_SCHEME" == "mqtts" || "$MQTT_SCHEME" == "ssl" || "$MQTT_SCHEME" == "tls" ]]; then
  MOSQ_ARGS+=("--tls")
fi

TOPIC="${MQTT_TOPIC_PREFIX%/}/$HOSTNAME"

log() {
  local level="$1"; shift
  local now
  now="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  if [[ "$level" == "debug" && "$LOG_LEVEL" != "debug" ]]; then
    return
  fi
  echo "$now [$level] $*" >&2
}

read_mem_percent() {
  awk '
    /MemTotal/ { total=$2 }
    /MemAvailable/ { available=$2 }
    END {
      if (total > 0) {
        printf "%.2f", (total-available)/total*100
      } else {
        print "0"
      }
    }
  ' /proc/meminfo
}

read_disk_percent() {
  df --output=pcent / | tail -n 1 | tr -dc '0-9.'
}

read_temp_c() {
  local thermal="/sys/class/thermal/thermal_zone0/temp"
  if [[ -f "$thermal" ]]; then
    awk '{ printf "%.2f", $1/1000 }' "$thermal"
  fi
}

publish_once() {
  local timestamp uptime load1 load5 load15 mem_percent disk_percent temp_c process_count payload

  timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  uptime="$(awk '{print $1}' /proc/uptime)"
  read load1 load5 load15 _ < /proc/loadavg
  mem_percent="$(read_mem_percent)"
  disk_percent="$(read_disk_percent)"
  temp_c="$(read_temp_c || true)"
  process_count="$(ps ax | wc -l)"

  payload=$(cat <<JSON
{
  "hostname": "${HOSTNAME}",
  "timestamp": "${timestamp}",
  "uptime_seconds": ${uptime},
  "cpu": {
    "load_average": [${load1}, ${load5}, ${load15}]
  },
  "memory_percent": ${mem_percent},
  "disk_percent": ${disk_percent:-0},
  "process_count": ${process_count},
  "temperature_c": ${temp_c:-null}
}
JSON
)

  mosquitto_pub "${MOSQ_ARGS[@]}" -t "$TOPIC" -m "$payload"
  log info "Published heartbeat: $payload"
}

trap 'log info "Exiting"; exit 0' SIGINT SIGTERM

while true; do
  publish_once || log error "Failed to publish heartbeat"
  sleep "$INTERVAL"
done
