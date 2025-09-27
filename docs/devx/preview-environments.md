# Pull Request Preview Environments

Preview environments are provisioned per pull request using ECS Fargate. The Terraform module under `modules/preview-env` creates an application load balancer, task definition, ECS service, and Route53 alias record (`pr-###.dev.blackroad.io`).

## GitHub Action flow

1. `preview-environment` workflow triggers on PR open/reopen/update.
2. Docker image is built and pushed to the preview ECR repository with tag `pr<NUMBER>`.
3. Terraform runs from `infra/preview-env` using the pull request number to namespace resources and state.
4. A PR comment and Slack notification share the preview URL.
5. When the PR closes, Terraform destroys the resources and posts a teardown message to Slack.

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

### Local operations

Use the helper script to apply or destroy previews from your workstation:

```bash
PR=128 make deploy
PR=128 make preview-destroy
```

Set the appropriate environment variables (cluster, VPC, hosted zone, etc.) before running the commands so Terraform can connect to AWS.
