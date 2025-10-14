variable "region" {
  type        = string
  description = "AWS region for deployment"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.42.0.0/16"
}

variable "azs" {
  type        = list(string)
  description = "Availability zones used by the VPC"
  default     = ["us-east-1a", "us-east-1b"]
}

variable "private_subnets" {
  type        = list(string)
  description = "Private subnet CIDRs"
  default     = ["10.42.1.0/24", "10.42.2.0/24"]
}

variable "public_subnets" {
  type        = list(string)
  description = "Public subnet CIDRs"
  default     = ["10.42.101.0/24", "10.42.102.0/24"]
}
