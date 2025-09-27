# Preview Environment Terraform Module

This module provisions an ephemeral preview environment for a pull request. It creates an ECS service running on Fargate behind an application load balancer and publishes the environment under a predictable `pr-<number>.dev.blackroad.io` hostname.

## Features

- Builds a dedicated task definition and ECS service per pull request.
- Creates an application load balancer with a security group locked down to HTTP/HTTPS traffic.
- Publishes an alias record in Route53 pointing to the preview load balancer.
- Allows callers to inject environment variables and secrets into the container definition.
- Supports automatic teardown by reusing the same configuration with `terraform destroy`.

## Usage

```hcl
module "preview" {
  source = "../../modules/preview-env"

  project             = "prism-console"
  pr_number           = 128
  cluster_arn         = var.cluster_arn
  execution_role_arn  = var.execution_role_arn
  task_role_arn       = var.task_role_arn
  subnet_ids          = var.private_subnet_ids
  alb_subnet_ids      = var.public_subnet_ids
  vpc_id              = var.vpc_id
  hosted_zone_id      = var.hosted_zone_id
  hosted_zone_name    = "dev.blackroad.io"
  container_image     = "123456789012.dkr.ecr.us-east-1.amazonaws.com/prism-console:pr128"
  container_port      = 3000
  env_vars            = {
    NODE_ENV = "production"
  }
  secrets = [
    {
      name      = "DATABASE_URL"
      valueFrom = aws_secretsmanager_secret.example.arn
    }
  ]
}
```

Destroy the preview environment by running the same configuration with `terraform destroy` (the module name and arguments must remain unchanged between apply/destroy runs).

## Inputs

| Name | Type | Description |
| ---- | ---- | ----------- |
| `project` | `string` | Human-friendly name of the service the preview belongs to. |
| `pr_number` | `number` | Pull request identifier used to compose names and DNS entries. |
| `cluster_arn` | `string` | ARN of the ECS cluster hosting preview services. |
| `execution_role_arn` | `string` | IAM role assumed by the ECS task for pulling images and sending logs. |
| `task_role_arn` | `string` | IAM role assumed by the application container. Optional. |
| `subnet_ids` | `list(string)` | Private subnet IDs for running the tasks. |
| `alb_subnet_ids` | `list(string)` | Public subnet IDs used by the load balancer. |
| `vpc_id` | `string` | VPC identifier for security group associations. |
| `hosted_zone_id` | `string` | Route53 hosted zone ID for the preview DNS record. |
| `hosted_zone_name` | `string` | Root domain used for preview URLs (e.g. `dev.blackroad.io`). |
| `container_image` | `string` | Fully qualified image URI tagged with the PR number. |
| `container_port` | `number` | Application port exposed by the container. Defaults to `3000`. |
| `desired_count` | `number` | Number of tasks to run. Defaults to `1`. |
| `cpu` | `number` | CPU units for the task definition. Defaults to `512`. |
| `memory` | `number` | Memory (MiB) for the task definition. Defaults to `1024`. |
| `assign_public_ip` | `bool` | Whether to assign a public IP to the tasks. Defaults to `false`. |
| `env_vars` | `map(string)` | Plain environment variables injected into the container. Defaults to `{}`. |
| `secrets` | `list(object)` | Secret references passed directly to the container definition. Defaults to `[]`. |
| `health_check_path` | `string` | HTTP path used by the ALB health check. Defaults to `/`. |
| `protocol` | `string` | Listener protocol (`HTTP` or `HTTPS`). Defaults to `"HTTP"`. |
| `listener_certificate_arn` | `string` | ACM certificate ARN required when protocol is `HTTPS`. Optional. |
| `ingress_cidrs` | `list(string)` | CIDR ranges allowed to reach the ALB. Defaults to `["0.0.0.0/0"]`. |

## Outputs

| Name | Description |
| ---- | ----------- |
| `service_name` | Name of the ECS service powering the preview. |
| `task_definition_arn` | ARN of the task definition created for the preview. |
| `url` | Fully qualified preview URL (e.g. `https://pr-128.dev.blackroad.io`). |
```
