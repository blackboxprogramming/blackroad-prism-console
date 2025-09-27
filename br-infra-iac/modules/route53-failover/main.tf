terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

data "aws_route53_zone" "zone" {
  name         = var.hosted_zone_name
  private_zone = false
}

resource "aws_route53_health_check" "api" {
  type            = "HTTPS"
  fqdn            = var.alb_dns_name
  port            = 443
  resource_path   = var.health_check_path
  measure_latency = true
  regions         = ["us-east-1", "us-west-1", "us-west-2"]
  inverted        = false
  tags            = var.tags
}

resource "aws_s3_bucket" "maintenance" {
  bucket        = "${var.name}-maintenance"
  force_destroy = true
  tags          = var.tags
}

resource "aws_s3_bucket_public_access_block" "pab" {
  bucket = aws_s3_bucket.maintenance.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.name}-oac"
  description                       = "OAC for maintenance bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_acm_certificate" "cf_cert" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = var.tags
}

resource "aws_route53_record" "cf_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cf_cert.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.zone.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "cf_cert" {
  provider                 = aws.us_east_1
  certificate_arn          = aws_acm_certificate.cf_cert.arn
  validation_record_fqdns  = [for r in aws_route53_record.cf_cert_validation : r.fqdn]
}

resource "aws_cloudfront_distribution" "maintenance" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "Maintenance page for ${var.domain_name}"
  aliases         = [var.domain_name]

  origin {
    domain_name              = aws_s3_bucket.maintenance.bucket_regional_domain_name
    origin_id                = "s3-maintenance"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-maintenance"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  default_root_object = "index.html"

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.cf_cert.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = var.tags

  depends_on = [aws_acm_certificate_validation.cf_cert]
}

data "aws_iam_policy_document" "bucket" {
  statement {
    sid    = "AllowCloudFrontServiceRead"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.maintenance.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.maintenance.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "maintenance" {
  bucket = aws_s3_bucket.maintenance.id
  policy = data.aws_iam_policy_document.bucket.json
}

resource "aws_s3_object" "index" {
  bucket       = aws_s3_bucket.maintenance.id
  key          = "index.html"
  content_type = "text/html"
  content      = <<HTML
<!doctype html><html lang="en"><meta charset="utf-8">
<title>BlackRoad – Maintenance</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<body style="margin:0;font-family:system-ui,sans-serif;display:grid;place-items:center;height:100vh;background:#0b0b0b;color:#fff">
  <main style="text-align:center">
    <h1>We’ll be right back</h1>
    <p>api.blackroad.io is temporarily unavailable. Check <a href="https://status.blackroad.io" style="color:#9cf">status</a> for updates.</p>
  </main>
</body></html>
HTML
}

resource "aws_route53_record" "api_primary" {
  zone_id        = data.aws_route53_zone.zone.zone_id
  name           = var.domain_name
  type           = "A"
  set_identifier = "primary-alb"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }

  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.api.id
}

resource "aws_route53_record" "api_secondary" {
  zone_id        = data.aws_route53_zone.zone.zone_id
  name           = var.domain_name
  type           = "A"
  set_identifier = "secondary-cf"

  alias {
    name                   = aws_cloudfront_distribution.maintenance.domain_name
    zone_id                = aws_cloudfront_distribution.maintenance.hosted_zone_id
    evaluate_target_health = false
  }

  failover_routing_policy {
    type = "SECONDARY"
  }
}

output "maintenance_distribution" {
  value = aws_cloudfront_distribution.maintenance.domain_name
}
