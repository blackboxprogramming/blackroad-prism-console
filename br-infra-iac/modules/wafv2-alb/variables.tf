variable "name" {
  description = "Name for the WAFv2 Web ACL."
  type        = string
}

variable "scope" {
  description = "Scope of the Web ACL (REGIONAL for ALB)."
  type        = string
  default     = "REGIONAL"
}

variable "association_resource_arn" {
  description = "ARN of the resource (e.g., ALB) to associate with the Web ACL."
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to supported resources."
  type        = map(string)
  default     = {}
}

variable "enable_bot_control" {
  description = "Enable the AWS Bot Control managed rule group."
  type        = bool
  default     = true
}

variable "enable_anomaly_rules" {
  description = "Enable the AWS Anomaly managed rule group."
  type        = bool
  default     = false
  type = string
}

variable "alb_arn" {
  type = string
}

variable "scope" {
  type    = string
  default = "REGIONAL"
}

variable "rate_limit" {
  type    = number
  default = 1000
}

variable "ip_allowlist_cidrs" {
  type    = list(string)
  default = []
}

variable "ip_blocklist_cidrs" {
  type    = list(string)
  default = []
}

variable "enable_common_rules" {
  type    = bool
  default = true
}

variable "enable_ip_reputation_rules" {
  type    = bool
  default = true
}

variable "enable_known_bad_inputs" {
  type    = bool
  default = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
