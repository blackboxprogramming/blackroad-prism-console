# Environment Manifests for BlackRoad Prism Deployments

BlackRoad Prism relies on repeatable manifests so automation can reason about
infrastructure footprints without hard-coded environment logic. This note
captures the shape of the manifest files we intend to publish for preview,
staging, and production targets. Operators can lift the same schema into
workflows, Terraform modules, or custom deployment tooling without drift.

## Goals

- **Single source of truth** for infrastructure knobs that affect deployment
  workflows (clusters, image tags, health checks, feature flags).
- **Composable automation** so GitHub Actions, local scripts, and ChatOps bots
  can hydrate environment-specific values without duplicating YAML.
- **Audit-friendly history** because manifests live in Git and follow the same
  review process as code changes.

## Manifest layout

Environment definitions live in `infra/environments/<env>.manifest.yaml`. Each
file encodes the resources, credentials, and runtime metadata required to
activate the deployment pipeline.

```yaml
# infra/environments/<env>.manifest.yaml
version: 1
name: staging
aws:
  region: us-east-1
  account_id: 123456789012
  cluster_arn: arn:aws:ecs:us-east-1:123456789012:cluster/prism-staging
  load_balancer_arn: arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/prism-staging/abc123
  task_execution_role_arn: arn:aws:iam::123456789012:role/prism-staging-exec
  task_role_arn: arn:aws:iam::123456789012:role/prism-staging-app
container:
  image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/prism-console:sha-<commit>
  cpu: 1024
  memory: 2048
  desired_count: 2
networking:
  subnets:
    - subnet-aaa
    - subnet-bbb
  security_groups:
    - sg-123abc
health:
  path: /healthz
  interval_seconds: 30
  timeout_seconds: 5
  healthy_threshold: 3
  unhealthy_threshold: 2
settings:
  env_file: srv/blackroad-api/.env.staging.example
  flags:
    enable_search: true
    enable_live_collab: true
notifications:
  slack_channel: C0123456
  pagerduty_service: prism-staging
```

> The schema intentionally mirrors existing preview-environment inputs so
> current GitHub Actions can parse and re-use the data source.

### Required keys

| Section | Description |
| ------- | ----------- |
| `version` | Allows future schema upgrades without breaking old manifests. |
| `aws` | Core AWS identifiers used by Terraform and deployment scripts. |
| `container` | Runtime sizing knobs and image selection for the workload. |
| `networking` | Subnets and security groups assigned to the service tasks. |
| `health` | Parameters for ALB/ECS health checks and synthetic probes. |
| `settings` | Links to environment variable templates and feature gates. |
| `notifications` | Routing for ChatOps alerts, deploy summaries, and incidents. |

## Environment matrix

| Environment | Purpose | Deployment trigger | Notable defaults |
| ----------- | ------- | ------------------ | ---------------- |
| `preview` | Spin up per-PR test surfaces for reviewers. | GitHub Actions on PR open/sync. | Single-task service, 512 CPU/1024 memory, Slack summary only. |
| `staging` | Pre-production validation with seeded data. | Manual approval or scheduled nightly deploy. | Two tasks behind HTTPS ALB, synthetic smoke tests, PagerDuty on failure. |
| `production` | Customer-facing workloads. | Manual promotion via change windows. | Four tasks minimum, WAF + CDN integration, full incident routing. |

## Automation hooks

1. **GitHub Actions** reads manifests to hydrate Terraform variables and runtime
   secrets before applying infrastructure changes.
2. **`tools/verify-runtime.sh`** loads `settings.env_file` to ensure health
   checks execute with the same configuration used in ECS.
3. **ChatOps commands** (for example `/deploy blackroad staging`) pass the
   manifest path to the deploy runner so rollbacks, roll-forwards, and smoke
   tests share the same metadata.

## Next steps

- Populate `infra/environments/preview.manifest.yaml`,
  `infra/environments/staging.manifest.yaml`, and
  `infra/environments/production.manifest.yaml` with real account values.
- Update deployment workflows (`.github/workflows/deploy.yml`) to read manifests
  instead of inline environment variables.
- Extend runbooks in `RUNBOOK.md` with pointers to the manifests and the
  approval process for modifying them.

Maintaining declarative manifests keeps the deployment story predictable,
especially as the automation surface grows to cover Fly.io and AWS ECS in
parallel.
