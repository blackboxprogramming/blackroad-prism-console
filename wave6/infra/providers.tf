provider "okta" {
  org_name = var.okta_org
}

provider "datadog" {
  api_url  = "https://${var.datadog_site}"
  api_key  = var.datadog_api
  app_key  = var.datadog_app
}

provider "snowflake" {
  account = var.snowflake_account
}
