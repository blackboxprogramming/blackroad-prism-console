output "okta" {
  value = module.okta.group_ids
}
output "datadog" {
  value = {
    monitor_ids = module.datadog.monitor_ids
    slo_ids     = module.datadog.slo_ids
  }
}
output "snowflake" {
  value = module.snowflake.database_name
}
output "asana" {
  value = module.asana.project_ids
}
