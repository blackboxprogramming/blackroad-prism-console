#!/usr/bin/env bash
set -euo pipefail

ACTION=${1:-}
if [[ "$ACTION" != "apply" && "$ACTION" != "destroy" ]]; then
  echo "usage: $0 <apply|destroy>" >&2
  exit 1
fi

: "${PR_NUMBER:?Set PR_NUMBER to the pull request identifier}"

AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME=${PROJECT_NAME:-prism-console}
IMAGE_URI=${IMAGE_URI:-"${PROJECT_NAME}:pr${PR_NUMBER}"}
TF_DIR="infra/preview-env"

if ! command -v terraform >/dev/null 2>&1; then
  echo "terraform CLI is required on PATH" >&2
  exit 1
fi

export TF_VAR_region="$AWS_REGION"
export TF_VAR_pr_number="$PR_NUMBER"
export TF_VAR_container_image="$IMAGE_URI"

if [[ -n "${CLUSTER_ARN:-}" ]]; then export TF_VAR_cluster_arn="$CLUSTER_ARN"; fi
if [[ -n "${EXECUTION_ROLE_ARN:-}" ]]; then export TF_VAR_execution_role_arn="$EXECUTION_ROLE_ARN"; fi
if [[ -n "${TASK_ROLE_ARN:-}" ]]; then export TF_VAR_task_role_arn="$TASK_ROLE_ARN"; fi
if [[ -n "${SUBNET_IDS:-}" ]]; then export TF_VAR_subnet_ids="$SUBNET_IDS"; fi
if [[ -n "${ALB_SUBNET_IDS:-}" ]]; then export TF_VAR_alb_subnet_ids="$ALB_SUBNET_IDS"; fi
if [[ -n "${VPC_ID:-}" ]]; then export TF_VAR_vpc_id="$VPC_ID"; fi
if [[ -n "${HOSTED_ZONE_ID:-}" ]]; then export TF_VAR_hosted_zone_id="$HOSTED_ZONE_ID"; fi
if [[ -n "${HOSTED_ZONE_NAME:-}" ]]; then export TF_VAR_hosted_zone_name="$HOSTED_ZONE_NAME"; fi
if [[ -n "${ENV_VARS_JSON:-}" ]]; then export TF_VAR_env_vars="$ENV_VARS_JSON"; fi
if [[ -n "${SECRETS_JSON:-}" ]]; then export TF_VAR_secrets="$SECRETS_JSON"; fi

pushd "$TF_DIR" >/dev/null

if [[ -n "${TF_STATE_BUCKET:-}" ]]; then
  backend_args=(
    "-backend-config=bucket=${TF_STATE_BUCKET}"
    "-backend-config=key=preview/pr-${PR_NUMBER}.tfstate"
    "-backend-config=region=${AWS_REGION}"
  )
  if [[ -n "${TF_LOCK_TABLE:-}" ]]; then
    backend_args+=("-backend-config=dynamodb_table=${TF_LOCK_TABLE}")
  fi
  terraform init "${backend_args[@]}"
else
  terraform init
fi

if [[ "$ACTION" == "apply" ]]; then
  terraform apply -auto-approve
else
  terraform destroy -auto-approve
fi

popd >/dev/null
