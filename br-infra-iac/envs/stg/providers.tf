terraform {
  required_version = ">= 1.5.0"
  required_providers { aws = { source = "hashicorp/aws", version = ">= 5.0" } }
  backend "s3" {
    bucket         = "br-tfstate-<unique>"      # from bootstrap
    key            = "stg/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "br-terraform-lock"
    encrypt        = true
  }
}
provider "aws" { region = var.region }
