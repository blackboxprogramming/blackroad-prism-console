output "config_role_arn" {
  description = "IAM role ARN used by AWS Config"
  value       = aws_iam_role.config.arn
}

output "conformance_pack_name" {
  description = "Name of the deployed AWS Config conformance pack"
  value       = aws_config_conformance_pack.guardrails.name
}

output "securityhub_enabled" {
  description = "Security Hub standards enabled"
  value = {
    cis_foundations   = aws_securityhub_standards_subscription.cis.standards_arn
    foundational_bps  = aws_securityhub_standards_subscription.foundational.standards_arn
  }
}

output "guardduty_detector_id" {
  description = "GuardDuty detector identifier"
  value       = aws_guardduty_detector.this.id
}
