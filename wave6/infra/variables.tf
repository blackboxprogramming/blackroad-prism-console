variable "env" { type = string }
variable "tags" { type = map(string) }
variable "okta_org" { type = string }
variable "datadog_site" { type = string }
variable "datadog_api" { type = string, sensitive = true }
variable "datadog_app" { type = string, sensitive = true }
variable "snowflake_account" { type = string }
variable "asana_workspace" { type = string }
