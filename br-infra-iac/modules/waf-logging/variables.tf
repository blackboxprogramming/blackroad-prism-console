variable "name" {
  description = "Prefix name for resources (e.g., br-dev-api)."
  type        = string
}

variable "region" {
  description = "AWS region for the resources."
  type        = string
}

variable "web_acl_arn" {
  description = "ARN of the Web ACL to enable logging for."
  type        = string
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket to store WAF logs. Must be globally unique."
  type        = string
}

variable "s3_prefix" {
  description = "Prefix (folder) for WAF logs inside the bucket."
  type        = string
  default     = "waf_logs/"
}

variable "retention_days" {
  description = "Number of days to retain WAF logs before expiration."
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to created resources."
  type        = map(string)
  default     = {}
}
