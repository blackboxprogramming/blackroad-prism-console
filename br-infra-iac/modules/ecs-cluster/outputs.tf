output "cluster_name" { value = aws_ecs_cluster.this.name }
output "log_group"    { value = aws_cloudwatch_log_group.ecs.name }
