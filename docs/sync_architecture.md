# BlackRoad Sync Core Architecture

## Overview

The **blackroad_sync_core** service stitches together GitHub, Notion, Linear,
Slack, Hugging Face, and Dropbox so that every BlackRoad agent works from the
same source of truth.  The service is composed of three primary layers:

1. **Sync Orchestrator** – A FastAPI surface (`/api/sync`) backed by Celery workers
   and Redis.  Celery beat drives scheduled jobs that mirror data across systems,
   while manual triggers are exposed over HTTP and Slack (`/sync now`).
2. **Collective Awareness** – A JSON knowledge store at
   `registry/blackroad_context.json` summarising repositories, documents, Linear
   issues, and last commit highlights.  A dedicated FastAPI module
   (`api/context.py`) exposes this data to every agent.
3. **Observability & Feedback** – Sync events are logged to
   `logs/sync_events.log`, published on the Redis pub/sub channel
   `blackroad.sync.events`, and surfaced via a Grafana dashboard.

## Data Flow

```mermaid
graph TD
    subgraph Sources
        A[GitHub] -->|Merged PR| B
        C[Linear] -->|New Issue| B
        D[Notion] -->|New Doc| B
        E[Slack] -->|/task Command| B
        F[Hugging Face] -->|Model Release| B
        G[Dropbox] -->|New Assets| B
    end

    subgraph Sync Hub
        B[Celery Workers]
        H[Redis Broker]
        I[FastAPI Sync API]
    end

    B --> H
    I --> H
    H --> J[(Sync Queue)]
    B --> K{Sync Jobs}
    K --> L[Notion]
    K --> M[GitHub]
    K --> N[Slack]
    K --> O[Dropbox]

    B --> P[(logs/sync_events.log)]
    B --> Q[Redis Pub/Sub]
    Q --> R[#blackroad-sync]
    P --> S[Grafana Dashboards]

    B --> T[Collective Context Builder]
    T --> U[(registry/blackroad_context.json)]
    U --> V[/api/context]
    V --> W[Agents]
```

## Schedules & Ownership

| Task                    | Schedule          | Agent       | Description |
| ----------------------- | ----------------- | ----------- | ----------- |
| `github_to_notion`      | `*/10 * * * *`    | Lucidia     | Mirrors merged PRs into Notion documentation pages |
| `notion_to_slack`       | `*/5 * * * *`     | Seraphina   | Announces new Notion docs into `#knowledge-feed` |
| `linear_to_github`      | `*/30 * * * *`    | Athena      | Opens GitHub branches and links issues |
| `huggingface_to_dropbox`| on-demand         | Celeste     | Backups the latest model artefacts into Dropbox |
| `dropbox_to_notion`     | on-demand         | Cicero      | Catalogues new assets into the Notion Assets table |
| `slack_to_linear`       | on-demand         | Persephone  | Converts `/task` commands into Linear issues |
| `full_refresh`          | on-demand         | Magnus      | Rebuilds cross-platform indices and context |

## Monitoring

Metrics are emitted into Prometheus and graphed through Grafana:

- **Sync Throughput** – Rate of successful jobs per platform.
- **Platform Latency** – Average execution duration for each connector.
- **Repo Update Frequency** – Most recent commit times for tracked repositories.

Alerts fire to `#dev-ops` whenever the per-platform error rate exceeds `5%` or
when no sync event has been recorded for more than one hour.

## Security & Access

All sync endpoints require a JWT with the `sync:execute` scope.  Redis
credentials and integration tokens are mounted as secrets in the runtime
environment; the repository intentionally stores only schema contracts and
configuration metadata.
