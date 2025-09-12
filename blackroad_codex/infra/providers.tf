terraform {
  required_version = ">= 1.6.0"
  required_providers {
    okta      = { source = "okta/okta", version = "~> 4.9" }
    datadog   = { source = "DataDog/datadog", version = "~> 3.37" }
    snowflake = { source = "Snowflake-Labs/snowflake", version = "~> 0.97" }
  }
}
provider "okta"      { org_name = var.okta_org }
provider "datadog"   { api_url = "https://${var.datadog_site}" api_key = var.datadog_api app_key = var.datadog_app }
provider "snowflake" { account = var.snowflake_account }
