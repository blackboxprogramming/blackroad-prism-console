# Preview Environments on ECS + ALB

Short-lived preview environments spin up for every pull request. GitHub Actions now performs two coordinated stages: a GHCR packaging pipeline produces a tagged container image (plus SBOM and vulnerability scan) while the AWS workflow pushes to ECR and applies the Terraform stack in [`infra/preview-env`](../infra/preview-env) to provision the ECS/Fargate service, ALB listener rule, target group, and Route53 DNS record. When the pull request closes the workflows destroy the same resources and prune the container tags so AWS and GHCR stay tidy.

## Required repository configuration

The workflow relies on a small set of repository **variables** and **secrets**. They mirror the inputs consumed by the Terraform wrapper and the AWS credentials used for provisioning.

| Type | Name | Description |
| --- | --- | --- |
| Variable | `AWS_REGION` (optional – defaults to `us-east-1`) | Region hosting the preview stack. Only required when overriding the default region baked into the workflow. |
| Secret | `PREVIEW_ENV_AWS_ROLE` | IAM role assumed via GitHub OIDC for provisioning. |
| Secret | `PREVIEW_ENV_ECR_REGISTRY` | Fully qualified ECR registry URI (e.g. `123456789012.dkr.ecr.us-east-1.amazonaws.com`). |
| Secret | `PREVIEW_ENV_ECR_REPOSITORY` | Repository name that stores preview images. |
| Secret | `PREVIEW_ENV_CLUSTER_ARN` | ARN of the ECS cluster that hosts preview services. |
| Secret | `PREVIEW_ENV_EXECUTION_ROLE_ARN` | Task execution role ARN for pulling from ECR and writing logs. |
| Secret | `PREVIEW_ENV_TASK_ROLE_ARN` | Application task role ARN with runtime permissions. |
| Secret | `PREVIEW_ENV_PRIVATE_SUBNET_IDS` | JSON array of private subnet IDs for the ECS service (e.g. `["subnet-aaa","subnet-bbb"]`). |
| Secret | `PREVIEW_ENV_PUBLIC_SUBNET_IDS` | JSON array of public subnet IDs used by the ALB. |
| Secret | `PREVIEW_ENV_VPC_ID` | VPC ID housing the preview subnets. |
| Secret | `PREVIEW_ENV_HOSTED_ZONE_ID` | Route53 hosted zone ID for `dev.blackroad.io`. |
| Secret | `PREVIEW_ENV_TF_STATE_BUCKET` | S3 bucket name backing the Terraform remote state. |
| Secret | `PREVIEW_ENV_TF_LOCK_TABLE` | DynamoDB table name used for Terraform state locking. |
| Secret | `PREVIEW_ENV_VARS_JSON` | JSON object of environment variables injected into the task definition. |
| Secret | `PREVIEW_ENV_SECRETS_JSON` | JSON object describing secrets pulled from AWS SSM/Secrets Manager. |
| Secret | `SLACK_PREVIEW_CHANNEL` | Channel ID (e.g. `C0123456`) for preview notifications. |
| Secret | `SLACK_BOT_TOKEN` | Bot token used by the Slack notification step. |

> The Terraform module expects the subnet, secret, and environment variable inputs as JSON strings so we can pass them directly to `terraform apply` without auxiliary files.

## Workflow behaviour

Two workflows respond to preview lifecycle events:

### Container packaging (`.github/workflows/preview-containers.yml`)

- **Opened / Reopened / Synchronize / Ready for review**
  1. Computes the GHCR image reference `ghcr.io/<owner>/<repo>:pr-<PR_NUMBER>-<SHORT_SHA>`.
  2. Builds and pushes the image via the reusable builder.
  3. Generates an SPDX SBOM artifact and uploads it as `pr-<PR_NUMBER>-sbom`.
  4. Scans the digest with Anchore Grype and uploads the SARIF to GitHub code scanning.
  5. Posts a sticky PR comment with docker pull/run instructions.

- **Closed**
  - `preview-containers-cleanup.yml` deletes the `pr-<PR_NUMBER>-*` GHCR tags.

### Infrastructure apply (`.github/workflows/preview-env.yml`)

- **Opened / Reopened / Synchronize**
  1. Builds a Docker image tagged `pr<PR_NUMBER>` using the repository root as build context.
  2. Pushes the image to the configured ECR repository.
  3. Runs `terraform init` inside `infra/preview-env/` with an S3 + DynamoDB backend derived from the provided secrets.
  4. Applies the Terraform stack with variables populated from the pull request number and secrets (cluster ARN, VPC, subnets, hosted zone, etc.).
  5. Captures the `preview_url` Terraform output and comments on the pull request with the URL.
  6. Posts a Slack message to the configured channel with the same preview link.

- **Closed**
  - Reinitialises Terraform with the PR-specific backend key and runs `terraform destroy` to remove the ECS service, ALB listener rule, target group, and DNS record.

Health-check paths, CPU/memory sizing, and environment variables can be tuned inside the workflow or Terraform module if the application needs different defaults.

## Operational notes

- Ensure a wildcard ACM certificate for `*.dev.blackroad.io` is attached to the ALB's HTTPS listener.
- Delegate `dev.blackroad.io` to Route53 and confirm the hosted zone ID matches the secret supplied to the workflow.
- Reserve listener rule priorities (for example `6000–6999`) for preview environments to avoid collisions with long-lived routes.
- Teardown typically completes within a minute of closing the pull request; any orphaned listener rules or target groups should be investigated immediately.
- `infra/preview-env/README.md` documents manual usage when debugging apply/destroy issues locally.
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
Preview envs wiring,Add preview-env.yml to app repo, set variables/secrets, test with PR #1.,amundsonalexa@gmail.com,Today,2025-10-15
Wildcard cert check,Ensure *.dev.blackroad.io ACM on ALB 443 listener.,amundsonalexa@gmail.com,Today,2025-10-15
Route53 zone verify,Confirm hosted zone dev.blackroad.io + NS at registrar.,amundsonalexa@gmail.com,Today,2025-10-15
Rule budget,Audit current listener rules; reserve priority range 6000–6999 for PR previews.,amundsonalexa@gmail.com,This Week,2025-10-16
Preview envs wiring,Add preview.yml to app repo, set variables/secrets, test with PR #1.,amundsonalexa@gmail.com,Today,2025-10-15
Wildcard cert check,Ensure *.dev.blackroad.io ACM on ALB 443 listener.,amundsonalexa@gmail.com,Today,2025-10-15
Route53 zone verify,Confirm hosted zone dev.blackroad.io + NS at registrar.,amundsonalexa@gmail.com,Today,2025-10-15
Rule budget,Audit current listener rules; reserve priority range 5000–9000 for PR previews.,amundsonalexa@gmail.com,This Week,2025-10-16
Cleanup watch,Verify teardown on PR close; no orphan rules/TGs/DNS.,amundsonalexa@gmail.com,This Week,2025-10-16
```

## Future enhancements

- Gate preview creation behind a `no-preview` PR label when manual verification is unnecessary.
- Post smoke-test results (for example `curl $PREVIEW_URL/health`) alongside the PR comment to give reviewers immediate confidence.
- Extend the workflow into a reusable action so other repositories in the organisation can call it with a handful of inputs.
- Gate preview creation behind a `no-preview` PR label if desired.
- Post a Slack notification alongside the PR comment when a preview goes live.
- Add a smoke-test step that curls `${PREVIEW_URL}/health` and reports success or failure in the PR comment.
