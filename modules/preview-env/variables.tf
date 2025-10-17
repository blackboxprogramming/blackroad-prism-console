variable "project" {
  type        = string
  description = "Human-friendly name of the service the preview belongs to."
}

variable "pr_number" {
  type        = number
  description = "Pull request identifier used to compose resource names."
}

variable "cluster_arn" {
  type        = string
  description = "ARN of the ECS cluster hosting preview services."
}

variable "execution_role_arn" {
  type        = string
  description = "IAM role assumed by ECS to pull images and emit logs."
}

variable "task_role_arn" {
  type        = string
  default     = ""
  description = "IAM role assumed by the preview task. Optional."
}

variable "subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for the ECS tasks."
}

variable "alb_subnet_ids" {
  type        = list(string)
  description = "Public subnet IDs used by the application load balancer."
}

variable "vpc_id" {
  type        = string
  description = "Identifier of the VPC hosting the preview infrastructure."
}

variable "hosted_zone_id" {
  type        = string
  description = "Route53 hosted zone ID serving the preview DNS records."
}

variable "hosted_zone_name" {
  type        = string
  description = "Root DNS name for preview environments (e.g. dev.blackroad.io)."
}

variable "container_image" {
  type        = string
  description = "Container image URI tagged with the PR number."
}

variable "container_name" {
  type        = string
  default     = ""
  description = "Override for the ECS container name. Defaults to the project name."
}

variable "container_port" {
  type        = number
  default     = 3000
  description = "Application port exposed by the container."
}

variable "desired_count" {
  type        = number
  default     = 1
  description = "Number of tasks to run for the preview environment."
}

variable "cpu" {
  type        = number
  default     = 512
  description = "CPU units allocated to the ECS task."
}

variable "memory" {
  type        = number
  default     = 1024
  description = "Memory (MiB) allocated to the ECS task."
}

variable "assign_public_ip" {
  type        = bool
  default     = false
  description = "Assign a public IP to the ECS tasks."
}

variable "env_vars" {
  type        = map(string)
  default     = {}
  description = "Plain environment variables injected into the preview container."
}

variable "secrets" {
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default     = []
  description = "List of secret references passed directly to the container definition."
}

variable "health_check_path" {
  type        = string
  default     = "/"
  description = "HTTP path used by the load balancer health check."
}

variable "protocol" {
  type        = string
  default     = "HTTP"
  description = "Listener protocol for the preview load balancer (HTTP or HTTPS)."
}

variable "listener_certificate_arn" {
  type        = string
  default     = ""
  description = "ACM certificate ARN used when protocol is HTTPS."
}

variable "ingress_cidrs" {
  type        = list(string)
  default     = ["0.0.0.0/0"]
  description = "CIDR ranges allowed to access the preview load balancer."
}

variable "log_retention_in_days" {
  type        = number
  default     = 14
  description = "CloudWatch log retention for preview task logs."
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Common tags applied to all preview resources."
}
