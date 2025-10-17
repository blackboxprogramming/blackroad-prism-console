output "site_bucket" {
  description = "Name of the S3 bucket hosting the status site."
  value       = aws_s3_bucket.site.bucket
}

output "cf_domain" {
  description = "CloudFront distribution domain name."
  value       = aws_cloudfront_distribution.dist.domain_name
}
