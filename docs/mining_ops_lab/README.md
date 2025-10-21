# Mining-Ops Lab

This package scaffolds a compliant, monetizable SaaS that lets organisations model, benchmark, and operate short-lived GPU/CPU workloads without distributing mining binaries. It focuses on profitability modelling, strong cost controls, and policy compliance so that teams can safely evaluate mining-style jobs inside their own cloud accounts.

## Key Capabilities

- **Profitability modeller** – deterministic and Monte Carlo projections with sensitivity notes.
- **Job runner** – validates container allowlists, runtime caps, and budget limits before submitting to the scheduler.
- **Compliance checklist** – per-provider guardrails and acknowledgement tracking.
- **Cost control loop** – estimates runtime cost, terminates jobs when caps are reached, and enforces nightly cleanup.
- **Usage and billing** – Stripe-ready plan definitions with daily job-minute quotas and upgrade paths.

The backend is implemented with FastAPI, async SQLAlchemy, and Redis-ready primitives. Terraform blueprints target AWS ECS Fargate, CloudWatch, and EventBridge to run user-supplied containers with a telemetry sidecar. React + Vite power the frontend dashboards, charts, and setup flows.

For detailed diagrams, security notes, billing configuration, and API definitions see the companion documents in this folder.
