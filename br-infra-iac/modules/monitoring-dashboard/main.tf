resource "aws_cloudwatch_dashboard" "this" {
  dashboard_name = "${var.name}-dash"
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "ALB Requests / 5xx"
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix],
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", var.alb_arn_suffix]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          period  = 60
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title = "WAF Allowed vs Blocked"
          metrics = [
            ["AWS/WAFV2", "AllowedRequests", "WebACL", var.web_acl_arn],
            ["AWS/WAFV2", "BlockedRequests", "WebACL", var.web_acl_arn]
          ]
          view   = "timeSeries"
          region = var.region
          period = 300
          stat   = "Sum"
        }
      }
    ]
  })

  tags = var.tags
}
