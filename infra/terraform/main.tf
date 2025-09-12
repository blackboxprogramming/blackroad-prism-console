terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "bucket_name" {
  type = string
}

resource "aws_s3_bucket" "assets" {
  bucket = var.bucket_name
  acl    = "private"
}

variable "enable_rds" {
  type    = bool
  default = false
}

resource "aws_db_instance" "staging" {
  count                  = var.enable_rds ? 1 : 0
  identifier             = "prism-staging"
  engine                 = "postgres"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  username               = "prism"
  password               = "prism-pass"
  skip_final_snapshot    = true
}
