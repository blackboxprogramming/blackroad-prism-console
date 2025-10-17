variable "region" {
  type        = string
  description = "AWS region hosting preview environments."
  default     = "us-east-1"
}

variable "project" {
  type        = string
  description = "Name of the service being deployed."
  default     = ""
}

variable "pr_number" {
  type        = number
  description = "Pull request number used to namespace the preview environment."
}

variable "cluster_arn" {
  type        = string
  description = "ARN of the ECS cluster running previews."
}

variable "execution_role_arn" {
  type        = string
  description = "IAM execution role used by ECS."
}

variable "task_role_arn" {
  type        = string
  description = "IAM task role assumed by the preview container."
  default     = ""
}

variable "subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for ECS tasks."
}

variable "alb_subnet_ids" {
  type        = list(string)
  description = "Public subnet IDs for the preview load balancer."
}

variable "vpc_id" {
  type        = string
  description = "VPC identifier hosting the preview infrastructure."
}

variable "hosted_zone_id" {
  type        = string
  description = "Route53 hosted zone ID for preview DNS records."
}

variable "hosted_zone_name" {
  type        = string
  description = "Root domain serving preview URLs (e.g. dev.blackroad.io)."
}

variable "container_image" {
  type        = string
  description = "Image URI to deploy for the preview."
}

variable "container_name" {
  type        = string
  description = "Optional override for the ECS container name."
  default     = ""
}

variable "container_port" {
  type        = number
  description = "Port exposed by the preview container."
  default     = 3000
}

variable "desired_count" {
  type        = number
  description = "Number of tasks to run for the preview environment."
  default     = 1
}

variable "cpu" {
  type        = number
  description = "CPU units allocated to the task."
  default     = 512
}

variable "memory" {
  type        = number
  description = "Memory (MiB) allocated to the task."
  default     = 1024
}

variable "assign_public_ip" {
  type        = bool
  description = "Assign a public IP to the ECS task ENI."
  default     = false
}

variable "env_vars" {
  type        = map(string)
  description = "Plain environment variables added to the task definition."
  default     = {}
}

variable "secrets" {
  type = list(object({
    name      = string
    valueFrom = string
  }))
  description = "Secret references forwarded to the container."
  default     = []
}

variable "health_check_path" {
  type        = string
  description = "HTTP path used for load balancer health checks."
  default     = "/"
}

variable "protocol" {
  type        = string
  description = "Load balancer protocol (HTTP or HTTPS)."
  default     = "HTTP"
}

variable "listener_certificate_arn" {
  type        = string
  description = "ACM certificate ARN required for HTTPS listeners."
  default     = ""
}

variable "ingress_cidrs" {
  type        = list(string)
  description = "CIDR blocks that can reach the preview load balancer."
  default     = ["0.0.0.0/0"]
}

variable "log_retention_in_days" {
  type        = number
  description = "CloudWatch log retention for preview workloads."
  default     = 14
}

variable "tags" {
  type        = map(string)
  description = "Tags added to all preview resources."
  default     = {}
}
