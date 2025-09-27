# Preview Environments on ECS + ALB

This repository now provisions short-lived preview environments for every pull request. The automation uses GitHub Actions with the AWS CLI to provision the ECS/Fargate service, ALB listener rule, target group, and Route53 DNS records, then tears everything back down when the PR closes.

## Required repository configuration

Set the following **repository variables** in the app repo that should receive previews:

| Variable | Description |
| --- | --- |
| `AWS_REGION` | AWS region hosting the ECS cluster and ALB. |
| `ECS_CLUSTER` | Name of the ECS cluster hosting preview services. |
| `VPC_ID` | VPC ID that contains the private subnets for tasks. |
| `SUBNETS` | Comma-separated list of private subnet IDs for the service ENIs (e.g. `subnet-aaa,subnet-bbb`). |
| `SERVICE_SG` | Security group ID assigned to preview tasks. |
| `ALB_ARN` | ARN of the existing Application Load Balancer. |
| `HTTPS_LISTENER_ARN` | ARN of the HTTPS (443) listener on the ALB. |
| `ALB_ZONE_ID` | Hosted zone ID for the ALB (from `describe-load-balancers`). |
| `ALB_DNS` | DNS name of the ALB (e.g. `my-alb-123.us-west-2.elb.amazonaws.com`). |
| `HOSTED_ZONE_ID` | Route53 hosted zone ID for `dev.blackroad.io`. |
| `CONTAINER_PORT` | Container port exposed by the service. |
| `ECR_REPO` | Fully qualified ECR repository URI for the service image. |
| `TASK_EXECUTION_ROLE_ARN` | IAM role ARN used as the task execution role. |
| `TASK_ROLE_ARN` | IAM role ARN used as the task role. |

Add the following **secret**:

| Secret | Description |
| --- | --- |
| `AWS_ROLE_TO_ASSUME` | IAM role ARN that the workflow assumes via OIDC for deployments. |

> Any additional application-specific secrets should continue to be sourced from SSM parameters referenced by the task definition.

## Workflow behaviour

The `.github/workflows/preview.yml` workflow reacts to pull request events:

- **Opened / Reopened / Synchronize**
  1. Builds and pushes a Docker image tagged `pr-<number>-<sha>`.
  2. Registers a task definition using that image tag (reusing existing log groups when present).
  3. Creates or updates the target group `br-pr-<number>` with a `/health` check.
  4. Creates or updates an HTTPS listener rule on the existing ALB that routes `pr-<number>.dev.blackroad.io` to the target group.
  5. Upserts a Route53 alias record targeting the ALB.
  6. Creates or updates an ECS Fargate service (desired count = 1) running in private subnets.
  7. Comments on the PR with the preview URL once the service is stable.

- **Closed**
  - Deletes the listener rule, ECS service, target group, and Route53 record that were created for the PR.

Health check paths, desired count, and CPU/memory sizes can be adjusted inside the workflow if the service has different requirements.

## Operational notes

- Ensure the hosted zone `dev.blackroad.io` exists and delegate NS records at the registrar.
- Attach an ACM certificate that covers `*.dev.blackroad.io` to the ALB's HTTPS listener.
- Reserve listener rule priorities in the `5000–9000` range to avoid collisions.
- Preview tear-down typically completes within a minute of the PR closing; listener rules and target groups should not remain afterwards.
- If a preview returns a 404 immediately after deployment, allow 60–90 seconds for DNS and ALB propagation.

## Communication templates

Slack (`#eng`):

```
Preview envs are live for this repo:
- Open a PR → get https://pr-<#>.dev.blackroad.io
- Push updates → env rolls forward
- Close PR → auto teardown (service, rule, TG, DNS)

If you hit a 404, give it ~60–90s for DNS/ALB propagation.
```

Asana CSV (DevX Epic):

```
Task Name,Description,Assignee Email,Section,Due Date
Preview envs wiring,Add preview.yml to app repo, set variables/secrets, test with PR #1.,amundsonalexa@gmail.com,Today,2025-10-15
Wildcard cert check,Ensure *.dev.blackroad.io ACM on ALB 443 listener.,amundsonalexa@gmail.com,Today,2025-10-15
Route53 zone verify,Confirm hosted zone dev.blackroad.io + NS at registrar.,amundsonalexa@gmail.com,Today,2025-10-15
Rule budget,Audit current listener rules; reserve priority range 5000–9000 for PR previews.,amundsonalexa@gmail.com,This Week,2025-10-16
Cleanup watch,Verify teardown on PR close; no orphan rules/TGs/DNS.,amundsonalexa@gmail.com,This Week,2025-10-16
```

## Future enhancements

- Gate preview creation behind a `no-preview` PR label if desired.
- Post a Slack notification alongside the PR comment when a preview goes live.
- Add a smoke-test step that curls `${PREVIEW_URL}/health` and reports success or failure in the PR comment.
