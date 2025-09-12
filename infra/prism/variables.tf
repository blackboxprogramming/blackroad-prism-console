variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "s3_bucket" {
  description = "Name of staging S3 bucket"
  type        = string
}

variable "project" {
  description = "Project prefix for resources"
  type        = string
  default     = "prism"
}

variable "db_username" {
  description = "RDS username"
  type        = string
}

variable "db_password" {
  description = "RDS password"
  type        = string
  sensitive   = true
}
