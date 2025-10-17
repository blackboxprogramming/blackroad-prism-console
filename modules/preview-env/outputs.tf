output "service_name" {
  description = "Name of the ECS service powering the preview."
  value       = aws_ecs_service.this.name
}

output "task_definition_arn" {
  description = "ARN of the preview task definition."
  value       = aws_ecs_task_definition.this.arn
}

output "url" {
  description = "Preview URL served via Route53."
  value       = "${var.protocol == "HTTPS" ? "https" : "http"}://${aws_route53_record.this.name}"
}
