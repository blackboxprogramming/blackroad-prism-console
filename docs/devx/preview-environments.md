# Pull Request Preview Environments

Preview environments are provisioned per pull request using ECS Fargate. The Terraform module under `modules/preview-env` creates an application load balancer, task definition, ECS service, and Route53 alias record (`pr-###.dev.blackroad.io`). A companion container pipeline publishes GHCR preview images (plus SBOM and vulnerability scan results) so reviewers can pull the image locally before AWS wiring completes.
Preview environments are provisioned per pull request using ECS Fargate. The Terraform module under `modules/preview-env` creates an application load balancer, task definition, ECS service, and Route53 alias record (`pr-###.dev.blackroad.io`). See [`environments/preview.yml`](../../environments/preview.yml) for the canonical manifest that release tooling and ChatOps reference.

## GitHub Action flow

Two workflows cooperate on every pull request:

- `preview-containers.yml` runs first, builds a GHCR image tagged `pr-<NUMBER>-<SHORT_SHA>`, uploads an SPDX SBOM artifact, scans the digest with Anchore Grype (publishing SARIF to code scanning), and posts docker pull/run instructions back to the PR.
- `preview-env.yml` (job name `preview-environment`) runs in parallel, builds/pushes the AWS ECR image, applies the Terraform stack under `infra/preview-env`, provisions the ECS service + ALB host rule, and comments/Slacks the preview URL. Closing the PR triggers the destroy path.

### Required secrets

| Secret | Description |
| ------ | ----------- |
| `PREVIEW_ENV_AWS_ROLE` | IAM role ARN assumed by the workflow. |
| `PREVIEW_ENV_ECR_REGISTRY` | ECR registry URI (e.g. `123456789012.dkr.ecr.us-east-1.amazonaws.com`). |
| `PREVIEW_ENV_ECR_REPOSITORY` | ECR repository name storing preview images. |
| `PREVIEW_ENV_TF_STATE_BUCKET` | S3 bucket used for Terraform state. |
| `PREVIEW_ENV_TF_LOCK_TABLE` | DynamoDB table for Terraform state locking. |
| `PREVIEW_ENV_CLUSTER_ARN` | ECS cluster ARN used for previews. |
| `PREVIEW_ENV_EXECUTION_ROLE_ARN` | ECS task execution role ARN. |
| `PREVIEW_ENV_TASK_ROLE_ARN` | ECS task role ARN. |
| `PREVIEW_ENV_PRIVATE_SUBNET_IDS` | JSON array of private subnet IDs. |
| `PREVIEW_ENV_PUBLIC_SUBNET_IDS` | JSON array of public subnet IDs for the ALB. |
| `PREVIEW_ENV_VPC_ID` | VPC identifier. |
| `PREVIEW_ENV_HOSTED_ZONE_ID` | Route53 hosted zone ID for `dev.blackroad.io`. |
| `PREVIEW_ENV_VARS_JSON` | JSON object of environment variables. |
| `PREVIEW_ENV_SECRETS_JSON` | JSON array of secret mappings. |
| `SLACK_BOT_TOKEN` | Slack bot token with permission to post to `#eng`. |
| `SLACK_PREVIEW_CHANNEL` | Channel ID (e.g. `C1234567890`) for preview announcements. |

The container workflow relies only on the built-in `GITHUB_TOKEN` to authenticate with GHCR.

### Cleanup

- `preview-containers-cleanup.yml` fires when the PR closes and removes `pr-<NUMBER>-*` tags from GHCR to keep the registry lean.
- `preview-env.yml` destroy job removes the ECS service, target group, ALB rule, Route53 record, and Terraform state entry.

### Local operations

Use the helper script to apply or destroy previews from your workstation:

```bash
PR=128 make deploy
PR=128 make preview-destroy
```

Set the appropriate environment variables (cluster, VPC, hosted zone, etc.) before running the commands so Terraform can connect to AWS.

To exercise the container locally, pull the GHCR image advertised in the PR comment and run it with `docker run --rm ghcr.io/blackboxprogramming/blackroad-prism-console:pr-<NUMBER>-<SHORT_SHA>`.
