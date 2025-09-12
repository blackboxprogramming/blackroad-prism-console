resource "datadog_monitor" "flow_latency_p95" {
  name    = "Flow Latency P95 (${var.env})"
  type    = "query alert"
  query   = "percentile(last_15m):p95:flow.latency_ms{env:${var.env}} > 60000"
  message = "P95 latency > 60s in ${var.env}. Autoremediate then page if unresolved."
  tags    = [for k, v in var.tags : "${k}:${v}"]
  notify_no_data = false
  renotify_interval = 60
}

resource "datadog_slo" "flow_uptime" {
  name = "Flow Uptime (${var.env})"
  type = "metric"
  thresholds {
    timeframe = "30d"
    target    = 99.9
    warning   = 99.5
  }
  query {
    numerator   = "sum:flow.success{env:${var.env}}.as_count()"
    denominator = "sum:flow.total{env:${var.env}}.as_count()"
  }
  tags = [for k, v in var.tags : "${k}:${v}"]
}
