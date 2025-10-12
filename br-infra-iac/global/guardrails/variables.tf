variable "region" {
  description = "AWS region where guardrails are provisioned"
  type        = string
}

variable "config_delivery_bucket" {
  description = "S3 bucket name used by AWS Config to deliver snapshots"
  type        = string
}

variable "config_role_name" {
  description = "Name for the AWS Config IAM role"
  type        = string
  default     = "blackroad-config-role"
}

variable "enable_macie" {
  description = "Set to true to enable Amazon Macie"
  type        = bool
  default     = false
}

variable "macie_export_bucket" {
  description = "S3 bucket for Macie classification exports"
  type        = string
  default     = ""
}

variable "macie_export_kms_key" {
  description = "KMS key ARN for Macie export encryption"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags applied to guardrail resources"
  type        = map(string)
  default     = {}
}
