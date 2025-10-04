variable "name" {
  type = string
}

variable "region" {
  type = string
}

variable "cluster_arn" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "container_name" {
  type    = string
  default = "br-api-gateway"
}

variable "container_port" {
  type    = number
  default = 3001
}

variable "cpu" {
  type    = number
  default = 256
}

variable "memory" {
  type    = number
  default = 512
}

variable "image_url" {
  type = string
}

variable "env" {
  type    = map(string)
  default = { NODE_ENV = "production" }
}

variable "secret_arns" {
  type    = map(string)
  default = {}
}

variable "desired_count" {
  type    = number
  default = 2
}

variable "min_capacity" {
  type    = number
  default = 2
}

variable "max_capacity" {
  type    = number
  default = 6
}

variable "health_check_path" {
  type    = string
  default = "/health"
}

variable "hosted_zone_name" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "canary_weight" {
  type        = number
  description = "Percentage of traffic routed to the canary target group (0-100)."
  default     = 0
}
