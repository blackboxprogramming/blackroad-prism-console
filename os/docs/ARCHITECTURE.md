# BlackRoad OS Architecture

```
                ┌────────────────────────────────────┐
                │            Users / UI              │
                │  Browser → http://pi.local         │
                └────────────────────────────────────┘
                                   │
                                   ▼
                         ┌─────────────────┐
                         │   Traefik v3    │
                         │ (reverse-proxy) │
                         └─────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌────────────────┐      ┌────────────────┐         ┌──────────────────┐
│  var-www       │      │  blackroad-api │         │   autopal        │
│  Node/Express  │      │  FastAPI       │         │   FastAPI        │
│  `/`           │      │  `/api`        │         │   `/autopal`     │
└────────────────┘      └────────────────┘         └──────────────────┘
        │                          │                          │
        └─────────────┬────────────┴────────────┬─────────────┘
                      ▼                         ▼
            ┌────────────────┐        ┌──────────────────┐
            │ aicodecloud    │        │ pi-ops           │
            │ Flask          │        │ FastAPI          │
            │ `/aicode`      │        │ `/pi-ops`        │
            └────────────────┘        └──────────────────┘
                      │                         │
                      └──────────────┬──────────┘
                                     ▼
                             ┌────────────────┐
                             │  Redis Cache   │
                             └────────────────┘

Additional services:

- **MQTT (Eclipse Mosquitto)** — broker for Pi telemetry. `pi-ops` connects using `MQTT_URL`.
- **Discord Bot** — worker container; no HTTP exposure. Health checked via `healthcheck.py`.
- **Watchtower** — optional auto-update service (disabled by default via zero replicas).

System orchestration:

- **Docker Compose** manages containers under `/opt/blackroad/os/docker`.
- **systemd** launches `blackroad-compose.service` during boot via `blackroad.target`.
- **brctl** CLI provides lifecycle, diagnostics, kiosk toggling, and upgrade commands.

Data flows:

- Traefik routes inbound HTTP traffic to services using PathPrefix rules.
- Services expose `/health` endpoints consumed by `brctl health` and the smoke test.
- `pi-ops` communicates with Mosquitto using the internal Docker network (`mqtt:1883`).
- Redis is available at `redis://redis:6379/0` for caching/session requirements.

Volumes:

- `mosq-data`, `mosq-conf` — Mosquitto persistence.
- Future stateful services (Postgres, MinIO) should declare volumes here.

Networking:

- Default network is created by Docker Compose (`blackroad_default`).
- Traefik listens on ports `80` (and optionally `443` when enabled).

Replace stub implementations with real service images or copy application code into corresponding build contexts when integrating the production stack.
