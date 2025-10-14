output "ecs_cluster_name" {
  value       = aws_ecs_cluster.this.name
  description = "ECS cluster used for workload execution"
}

output "log_group_name" {
  value       = aws_cloudwatch_log_group.jobs.name
  description = "CloudWatch log group for workload and telemetry containers"
}

output "task_definition_arn" {
  value       = aws_ecs_task_definition.job.arn
  description = "Task definition ARN for launching user workloads"
}
