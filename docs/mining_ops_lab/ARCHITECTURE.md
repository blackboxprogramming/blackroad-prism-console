# Architecture Overview

```mermaid
graph TD
    subgraph SaaS Platform
        UI[React Dashboard]
        API[FastAPI Backend]
        DB[(PostgreSQL)]
        Cache[(Redis)]
        Billing[Stripe]
    end

    subgraph AWS Account (Customer Owned)
        Scheduler[ECS Fargate]
        Sidecar[Telemetry Sidecar]
        CloudWatch[CloudWatch Metrics]
        EventBridge[EventBridge Rules]
    end

    UI -->|JWT| API
    API --> DB
    API --> Cache
    API --> Billing
    API -->|AssumeRole via OIDC| Scheduler
    Scheduler --> Sidecar
    Sidecar -->|OTLP/HTTP 10s| API
    Scheduler --> CloudWatch
    CloudWatch --> EventBridge
    EventBridge -->|Stop Task| Scheduler
```

## Backend

- **FastAPI** hosts REST endpoints for auth, scenarios, jobs, compliance, and billing.
- **SQLAlchemy (async)** models the relational schema for orgs, users, scenarios, jobs, telemetry, and audit logs.
- **Redis** tracks job state transitions and feeds the scheduler watchdog.
- **Telemetry ingestion** receives OTLP/HTTP payloads from the sidecar, normalises them into 10-second samples, and persists them to PostgreSQL and optionally pgvector.

## Scheduler Flow

1. Validate quotas (scenarios count, concurrent jobs, job-minute allowance) and compliance acknowledgements.
2. Resolve compute profile → hourly price, compare against job budget cap, and request confirmation for low caps.
3. Launch ECS Fargate task with user image + telemetry sidecar. Networking is outbound-only.
4. Watchdog Lambda polls CloudWatch/Redis every minute to terminate jobs breaching runtime or budget thresholds.
5. Nightly sweeper identifies orphaned tasks and cleans up logs, volumes, and ENIs.

## Frontend

- React + Vite + TypeScript with TanStack Query for data fetching and caching.
- Headless UI components ensure accessibility and quick theming.
- Routing: `/` (home), `/scenarios`, `/jobs/:id`, `/billing`, `/settings`.
- Charts powered by Recharts/Chart.js (pluggable) for telemetry, cost, and revenue overlays.

## Terraform Stack

- Creates VPC, subnets, NAT gateway, and ECS cluster (Fargate) with capacity providers for spot + on-demand.
- Defines task definitions for workload container and telemetry sidecar.
- Configures CloudWatch log groups, EventBridge rules, IAM roles/policies, and Parameter Store secrets encrypted with KMS.
- Outputs API gateway URL, ECS cluster name, and log group names for deployment automation.
