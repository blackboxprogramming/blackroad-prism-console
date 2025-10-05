# BlackRoad Fleet Time Synchronization Drop-In

This drop-in bundles everything required to standardize time synchronization across the BlackRoad fleet. It defines an internal chrony tier (running in containers), harmonized client configuration for Ubuntu, Raspberry Pi OS, and NVIDIA Jetson nodes, along with a Prometheus-friendly clock offset exporter and alert rules.

> **How to use:** Create a directory such as `infra/time-sync/` in your config repo, copy the snippets below into the indicated files, adjust the placeholder values for your network, then deploy.

---

## 1. Internal chrony tier (Docker on Alpine)

**Files:**
- `infra/time-sync/Dockerfile`
- `infra/time-sync/chrony.conf`
- `infra/time-sync/docker-compose.yml`

```dockerfile
# infra/time-sync/Dockerfile
FROM alpine:3.19
RUN apk add --no-cache chrony tzdata \
    && adduser -D -H chrony
USER chrony
EXPOSE 123/udp
VOLUME ["/var/lib/chrony"]
ENTRYPOINT ["/usr/sbin/chronyd"]
CMD ["-f", "/etc/chrony/chrony.conf", "-d"]
```

```conf
# infra/time-sync/chrony.conf
# Upstream time sources (public + cloud). Adjust to match BlackRoad policy.
pool time.google.com        iburst maxsources 3
pool 0.pool.ntp.org         iburst maxsources 2
pool 1.pool.ntp.org         iburst maxsources 2

# Step clock quickly on startup if offset > 1s, then stay smooth.
makestep 0.5 -1
rtcsync

# Serve LAN clients and keep state between restarts.
allow 10.0.0.0/8
allow 172.16.0.0/12
allow 192.168.0.0/16
local stratum 10
smoothtime 400 0.001
logdir /var/log/chrony

# Persist history for quicker convergence.
driftfile /var/lib/chrony/drift
ntsdumpdir /var/lib/chrony

# Optional: re-enable when a hardware PPS/GPS is attached.
#refclock PPS /dev/pps0 lock GPS refid PPS
```

```yaml
# infra/time-sync/docker-compose.yml
version: "3.9"
services:
  chrony:
    build: .
    container_name: ntp-t1
    restart: unless-stopped
    network_mode: host
    cap_add:
      - SYS_TIME
      - SYS_NICE
    volumes:
      - ./chrony.conf:/etc/chrony/chrony.conf:ro
      - chrony-state:/var/lib/chrony
      - chrony-log:/var/log/chrony
    healthcheck:
      test: ["CMD-SHELL", "chronyc tracking | grep -q 'Leap status.*Normal'"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
volumes:
  chrony-state:
  chrony-log:
```

**Deployment pattern:**
1. Stand up **three** small VMs or edge boxes (e.g., `ntp1.blackroad.lan`, `ntp2.blackroad.lan`, `ntp3.blackroad.lan`).
2. Place the files above on each node, customizing the `container_name` and `local stratum` if you prefer unique IDs.
3. Run `docker compose up -d --build` on each host. Add `PPS` directives on the node with hardware receivers.
4. Restrict inbound UDP/123 traffic to trusted subnets only.
5. Monitor the health check via Docker or your node agent; it fails if chrony loses sync.

---

## 2. Fleet client configuration

All clients should run chrony and point only at the internal tier. Replace `ntp{1..3}.blackroad.lan` with the actual hostnames/IPs.

### Ubuntu (20.04+ and Debian-based servers)

```bash
sudo apt-get update && sudo apt-get install -y chrony
sudo tee /etc/chrony/sources.d/blackroad.conf >/dev/null <<'EOC'
server ntp1.blackroad.lan iburst maxsources 1
server ntp2.blackroad.lan iburst maxsources 1
server ntp3.blackroad.lan iburst maxsources 1
makestep 1.0 3
rtcsync
EOC
sudo systemctl enable --now chrony
```

### Raspberry Pi OS (Bullseye/Bookworm)

Pi devices usually lack an RTC; add an aggressive initial step and disable the default NTP daemon if present.

```bash
sudo apt-get purge -y ntp openntpd systemd-timesyncd || true
sudo apt-get install -y chrony
sudo tee /etc/chrony/chrony.conf >/dev/null <<'EOC'
pool ntp1.blackroad.lan iburst
pool ntp2.blackroad.lan iburst
pool ntp3.blackroad.lan iburst
initstepslew 5 ntp1.blackroad.lan ntp2.blackroad.lan ntp3.blackroad.lan
makestep 0.5 10
rtcsync
logchange 0.5
EOC
sudo systemctl enable --now chrony
```

### NVIDIA Jetson (Ubuntu-based with optional PPS)

```bash
sudo apt-get update && sudo apt-get install -y chrony gpsd gpsd-clients
sudo tee /etc/chrony/chrony.conf >/dev/null <<'EOC'
server ntp1.blackroad.lan iburst
server ntp2.blackroad.lan iburst
server ntp3.blackroad.lan iburst
makestep 0.5 5
rtcsync
refclock SOCK /var/run/pps?.sock refid PPS poll 4 prefer
hwtimestamp *
EOC
sudo usermod -a -G dialout,gpsd chrony
sudo systemctl enable --now chrony
```

> **Validation:** Run `chronyc tracking` and ensure the `Leap status` is `Normal` and `Last offset` remains within ±50 ms.

---

## 3. Prometheus-friendly clock offset exporter

This script writes metrics into a textfile collector directory consumed by node_exporter. Adjust the `TEXTFILE_DIR` path if you store textfile metrics elsewhere.

**Files:**
- `infra/time-sync/exporter/clock_offset.sh`
- `infra/time-sync/exporter/clock-offset.service`
- `infra/time-sync/exporter/clock-offset.timer`

```bash
#!/usr/bin/env bash
# infra/time-sync/exporter/clock_offset.sh
set -euo pipefail
TEXTFILE_DIR="/var/lib/node_exporter/textfile_collector"
OUTPUT_FILE="${TEXTFILE_DIR}/clock_offset.prom"
mkdir -p "${TEXTFILE_DIR}"
tracking=$(chronyc tracking)
offset=$(awk -F': ' '/Last offset/ {print $2}' <<<"${tracking}" | awk '{print $1}')
state=$(awk -F': ' '/Leap status/ {print $2}' <<<"${tracking}")
cat <<PROM > "${OUTPUT_FILE}"
# HELP system_clock_offset_seconds Last recorded NTP offset (seconds).
# TYPE system_clock_offset_seconds gauge
system_clock_offset_seconds ${offset:-0}
# HELP system_clock_leap_status Whether chrony reports a leap (0=normal,1=warning)
# TYPE system_clock_leap_status gauge
system_clock_leap_status $([[ "${state}" == "Normal" ]] && echo 0 || echo 1)
PROM
```

```ini
# infra/time-sync/exporter/clock-offset.service
[Unit]
Description=Emit chrony clock offset metrics for Prometheus
After=chrony.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/clock_offset.sh
```

```ini
# infra/time-sync/exporter/clock-offset.timer
[Unit]
Description=Schedule chrony clock offset exports

[Timer]
OnBootSec=2min
OnUnitActiveSec=1min
AccuracySec=5s
Persistent=true

[Install]
WantedBy=timers.target
```

**Install on each node:**
```bash
sudo install -m 0755 infra/time-sync/exporter/clock_offset.sh /usr/local/bin/clock_offset.sh
sudo install -m 0644 infra/time-sync/exporter/clock-offset.service /etc/systemd/system/clock-offset.service
sudo install -m 0644 infra/time-sync/exporter/clock-offset.timer /etc/systemd/system/clock-offset.timer
sudo systemctl daemon-reload
sudo systemctl enable --now clock-offset.timer
```

---

## 4. Prometheus alerts (example rule file)

Drop the following into your Prometheus rules directory (e.g., `monitoring/rules/time-sync.yaml`) and reload Prometheus.

```yaml
# monitoring/rules/time-sync.yaml
groups:
  - name: time-sync
    interval: 30s
    rules:
      - alert: ClockOffsetWarning
        expr: abs(system_clock_offset_seconds) > 0.05
        for: 2m
        labels:
          severity: warning
          team: sre
        annotations:
          summary: "Clock drift warning on {{ $labels.instance }}"
          description: |
            Chrony offset is {{ $value | printf "%.3f" }}s. Investigate connectivity
            to ntp1-3.blackroad.lan or local resource contention.
      - alert: ClockOffsetCritical
        expr: abs(system_clock_offset_seconds) > 0.25 or system_clock_leap_status == 1
        for: 1m
        labels:
          severity: critical
          team: sre
        annotations:
          summary: "Clock drift critical on {{ $labels.instance }}"
          description: |
            Offset exceeds 250 ms or chrony reports a leap/non-normal state.
            Restart chrony, verify reachability to the internal NTP tier, and check hardware clocks.
      - alert: ChronyOutOfSync
        expr: max_over_time(system_clock_leap_status[5m]) == 1
        for: 5m
        labels:
          severity: critical
          team: sre
        annotations:
          summary: "Chrony unsynchronised on {{ $labels.instance }}"
          description: |
            Chrony has reported a non-normal leap status for over five minutes.
            Host clock may be free-running.
```

---

## 5. Logging & ingestion guardrails

- Ensure every service uses RFC3339/ISO-8601 timestamps with timezone suffixes (`Z` for UTC).
- In your ingest pipeline (e.g., OpenTelemetry Collector), reject or flag events with timestamps older/newer than 5 minutes relative to collector time.
- When investigating anomalies, compare `system_clock_offset_seconds` against application error bursts to quickly confirm or rule out time skew.

---

## 6. Verification checklist

1. `chronyc sources -v` on each internal server shows upstream peers reachable and `^*` marking the selected source.
2. `chronyc tracking` on clients shows `Leap status : Normal` and offsets < 50 ms.
3. Prometheus displays the new metrics, and alert silence/resolution works as expected.
4. Log entries across services order correctly after enabling the drop-in.

By standardizing on this stack, BlackRoad gains reliable, debuggable time across all platforms—preventing out-of-order logs and the phantom errors that skewed clocks create.
