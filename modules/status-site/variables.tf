variable "name" {
  description = "Friendly name used for tagging and resource prefixes."
  type        = string
}

variable "hosted_zone_name" {
  description = "Route53 public hosted zone name (e.g., blackroad.io.)."
  type        = string
}

variable "domain_name" {
  description = "Fully qualified domain name for the status site (e.g., status.blackroad.io)."
  type        = string
}

variable "tags" {
  description = "Common tags applied to all resources."
  type        = map(string)
  default     = {}
}
