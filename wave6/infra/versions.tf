terraform {
  required_version = ">= 1.6.0"
  required_providers {
    okta    = { source = "okta/okta", version = "~> 4.9" }
    datadog = { source = "DataDog/datadog", version = "~> 3.37" }
    snowflake = { source = "Snowflake-Labs/snowflake", version = "~> 0.97" }
  }
}
