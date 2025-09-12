output "monitor_ids" {
  value = [datadog_monitor.flow_latency_p95.id]
}

output "slo_ids" {
  value = [datadog_slo.flow_uptime.id]
}
