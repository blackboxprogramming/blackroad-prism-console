# Environment manifests

This directory holds the declarative manifests for the three delivery surfaces we operate today:
preview, staging, and production.  Each manifest is a single source of truth for how code leaves the
repository, what infrastructure it lands on, and the guardrails that keep the environment healthy.

The manifests intentionally stay platform-agnostic.  They describe the outcome we expect (domains,
scaling limits, dependencies, approvals) and reference the automation surfaces that realise that
outcome (GitHub workflows, Terraform modules, runbooks).  Our deploy pipelines can consume these
files directly to render environment-specific plans or to hydrate ChatOps commands with the right
context.

## File layout

| File | Purpose |
| --- | --- |
| `preview.yaml` | Ephemeral review apps for pull requests (Fly.io edge + AWS ECS preview stack). |
| `staging.yaml` | Always-on staging slice that mirrors production topology while allowing faster rollouts. |
| `production.yaml` | Customer-facing footprint running behind Cloudflare with the strictest guardrails. |

## Schema

Every manifest shares the same top-level structure:

```yaml
meta:
  name: staging
  tier: stable
  description: "Short human readable summary."
  owners:
    - "platform@blackroad.io"
  tags: [web, api, workflows]

runtime:
  code:
    repo: blackroad-prism-console
    entrypoints:
      - path: sites/blackroad
        type: nextjs
      - path: srv/blackroad-api
        type: express
  artifacts:
    - workflow: .github/workflows/prism-ci.yml
      produces: [docker-image, static-assets]

infrastructure:
  compute: []           # Fly.io apps, ECS services, cron jobs, workers
  data: []              # Postgres, Redis, S3 buckets, etc.
  networking: []        # Domains, DNS, CDN, TLS

operations:
  deployments: []       # pipelines, approvals, rollout strategy
  observability: []     # dashboards, alerts, logging
  compliance: []        # backups, retention, access controls
  runbooks: []          # URLs into RUNBOOK.md or pager playbooks

slo:
  availability: "99.5%"
  latency_ms_p95: 600
  rto_minutes: 30
  rpo_minutes: 15
```

A field can be omitted when it does not apply, but try to prefer explicit empty lists or
`description` placeholders so gaps are obvious during reviews.

## Consuming the manifests

* **Automation** – The GitHub Actions defined under `.github/workflows/` can look up a manifest to
  determine the target domain, scale, and secrets bundle before calling Terraform or deployment
  hooks.
* **ChatOps** – The `/deploy` and `/cache` commands reference these manifests to advertise the
  environment they are touching and to link to the correct runbooks.
* **Runbooks** – Operators can rely on a single location for domain/IP ownership, key dependencies,
  and the change management process before approving a rollout.

When adding a new environment, copy one of the existing manifests, update the metadata and
infrastructure blocks, and link the file from the table above.
