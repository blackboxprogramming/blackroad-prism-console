resource "aws_ecs_cluster" "this" {
  name = "${var.name}-ecs"
  setting { name = "containerInsights"; value = "enabled" }
  configuration { execute_command_configuration { logging = "DEFAULT" } }
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  tags = merge(var.tags, { Name = "${var.name}-ecs" })
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/blackroad/${var.name}/ecs"
  retention_in_days = 30
  tags              = var.tags
}
