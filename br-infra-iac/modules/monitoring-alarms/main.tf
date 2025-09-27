resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.name}-alb-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  period              = 300
  threshold           = 20
  statistic           = "Sum"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }
  alarm_actions = [var.sns_topic_arn]
  tags          = var.tags
}

resource "aws_cloudwatch_metric_alarm" "waf_blocks" {
  alarm_name          = "${var.name}-waf-blocks"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  period              = 300
  threshold           = 50
  statistic           = "Sum"
  namespace           = "AWS/WAFV2"
  metric_name         = "BlockedRequests"
  dimensions = {
    WebACL = var.web_acl_arn
  }
  alarm_actions = [var.sns_topic_arn]
  tags          = var.tags
}
