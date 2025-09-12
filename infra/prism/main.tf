terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

resource "aws_s3_bucket" "prism_artifacts" {
  bucket        = var.s3_bucket
  force_destroy = true
  tags = {
    Environment = "staging"
    Service     = var.project
  }
}

resource "aws_db_instance" "prism" {
  identifier              = "${var.project}-db"
  engine                  = "postgres"
  instance_class          = "db.t3.micro"
  username                = var.db_username
  password                = var.db_password
  allocated_storage       = 20
  skip_final_snapshot     = true
}
