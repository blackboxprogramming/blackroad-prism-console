output "web_acl_arn" {
  description = "ARN of the created WAFv2 Web ACL."
  value       = aws_wafv2_web_acl.this.arn
}
