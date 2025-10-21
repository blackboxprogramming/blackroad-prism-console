terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

locals {
  metric_name = length(regexall("[A-Za-z0-9]", var.name)) > 0 ?
    regexreplace(var.name, "[^A-Za-z0-9]", "") :
    "WebACL"
}

resource "aws_wafv2_web_acl" "this" {
  name  = var.name
  scope = var.scope
resource "aws_wafv2_ip_set" "allow" {
  count              = length(var.ip_allowlist_cidrs) > 0 ? 1 : 0
  name               = "${var.name}-allow"
  description        = "Allowlist"
  scope              = var.scope
  ip_address_version = "IPV4"
  addresses          = var.ip_allowlist_cidrs
  tags               = var.tags
}

resource "aws_wafv2_ip_set" "block" {
  count              = length(var.ip_blocklist_cidrs) > 0 ? 1 : 0
  name               = "${var.name}-block"
  description        = "Blocklist"
  scope              = var.scope
  ip_address_version = "IPV4"
  addresses          = var.ip_blocklist_cidrs
  tags               = var.tags
}

resource "aws_wafv2_web_acl" "this" {
  name        = "${var.name}-waf"
  description = "WAF for ${var.name} ALB"
  scope       = var.scope

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = local.metric_name
    sampled_requests_enabled   = true
  }

  rule {
    name     = "AWS-CommonRuleSet"
    priority = 10

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-KnownBadInputs"
    priority = 12

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputs"
      sampled_requests_enabled   = true
    metric_name                = "${var.name}-waf"
    sampled_requests_enabled   = true
  }

  dynamic "rule" {
    for_each = length(var.ip_allowlist_cidrs) > 0 ? [1] : []

    content {
      name     = "AllowList"
      priority = 1

      action {
        allow {}
      }

      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.allow[0].arn
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "AllowList"
        sampled_requests_enabled   = true
      }
    }
  }

  dynamic "rule" {
    for_each = length(var.ip_blocklist_cidrs) > 0 ? [1] : []

    content {
      name     = "BlockList"
      priority = 2

      action {
        block {}
      }

      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.block[0].arn
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "BlockList"
        sampled_requests_enabled   = true
      }
    }
  }

  dynamic "rule" {
    for_each = var.enable_common_rules ? [1] : []

    content {
      name     = "AWS-AWSManagedRulesCommonRuleSet"
      priority = 10

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          vendor_name = "AWS"
          name        = "AWSManagedRulesCommonRuleSet"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "CommonRuleSet"
        sampled_requests_enabled   = true
      }
    }
  }

  dynamic "rule" {
    for_each = var.enable_bot_control ? [1] : []
    content {
      name     = "AWS-BotControl"
      priority = 13
    for_each = var.enable_ip_reputation_rules ? [1] : []

    content {
      name     = "AWS-AmazonIpReputationList"
      priority = 11

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          vendor_name = "AWS"
          name        = "AWSManagedRulesBotControlRuleSet"
          name        = "AWSManagedRulesAmazonIpReputationList"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "BotControl"
        metric_name                = "IpReputation"
        sampled_requests_enabled   = true
      }
    }
  }

  dynamic "rule" {
    for_each = var.enable_anomaly_rules ? [1] : []
    content {
      name     = "AWS-AnomalyRuleSet"
      priority = 14
    for_each = var.enable_known_bad_inputs ? [1] : []

    content {
      name     = "AWS-KnownBadInputs"
      priority = 12

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          vendor_name = "AWS"
          name        = "AWSManagedRulesAnomalyRuleSet"
          name        = "AWSManagedRulesKnownBadInputsRuleSet"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "Anomaly"
        metric_name                = "KnownBadInputs"
        sampled_requests_enabled   = true
      }
    }
  }

  tags = var.tags
}

resource "aws_wafv2_web_acl_association" "this" {
  count = var.association_resource_arn == null || var.association_resource_arn == "" ? 0 : 1

  resource_arn = var.association_resource_arn
  web_acl_arn  = aws_wafv2_web_acl.this.arn
}
  rule {
    name     = "RateLimitPerIP"
    priority = 90

    action {
      block {}
    }

    statement {
      rate_based_statement {
        aggregate_key_type = "IP"
        limit              = var.rate_limit
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimit"
      sampled_requests_enabled   = true
    }
  }

  tags = var.tags
}

resource "aws_wafv2_web_acl_association" "assoc" {
  resource_arn = var.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.this.arn
}

output "web_acl_arn" {
  value = aws_wafv2_web_acl.this.arn
}
