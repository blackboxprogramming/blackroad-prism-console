terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# IAM
data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "task_exec" {
  name               = "${var.name}-exec"
  assume_role_policy = data.aws_iam_policy_document.assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "exec_default" {
  role       = aws_iam_role.task_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# allow read SSM params for secrets
data "aws_iam_policy_document" "ssm" {
  statement {
    actions   = ["ssm:GetParameters", "ssm:GetParameter"]
    resources = values(var.secrets)
  }
}

resource "aws_iam_policy" "ssm" {
  name   = "${var.name}-ssm"
  policy = data.aws_iam_policy_document.ssm.json
}

resource "aws_iam_role_policy_attachment" "exec_ssm" {
  role       = aws_iam_role.task_exec.name
  policy_arn = aws_iam_policy.ssm.arn
}

resource "aws_iam_role" "task_role" {
  name               = "${var.name}-task"
  assume_role_policy = data.aws_iam_policy_document.assume.json
  tags               = var.tags
}

# CloudWatch log group
resource "aws_cloudwatch_log_group" "lg" {
  name              = "/blackroad/${var.name}"
  retention_in_days = 14
  tags              = var.tags
}

# Task definition
locals {
  env_kv    = [for k, v in var.env : { name = k, value = v }]
  secret_kv = [for k, v in var.secrets : { name = k, valueFrom = v }]
}

resource "aws_ecs_task_definition" "td" {
  family                   = "${var.name}-td"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.task_exec.arn
  task_role_arn            = aws_iam_role.task_role.arn
  container_definitions = jsonencode([
    {
      name      = var.name
      image     = var.image
      essential = true
      environment = local.env_kv
      secrets     = local.secret_kv
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.lg.name
          awslogs-region        = var.region
          awslogs-stream-prefix = var.name
        }
      }
    }
  ])

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  tags = var.tags
}

# EventBridge rule → ECS RunTask
resource "aws_cloudwatch_event_rule" "rule" {
  name                = "${var.name}-rule"
  schedule_expression = var.schedule_expression
  tags                = var.tags
}

resource "aws_cloudwatch_event_target" "target" {
  rule      = aws_cloudwatch_event_rule.rule.name
  target_id = "${var.name}-target"
  arn       = var.cluster_arn
  role_arn  = aws_iam_role.events.arn

  ecs_target {
    launch_type         = "FARGATE"
    task_definition_arn = aws_ecs_task_definition.td.arn

    network_configuration {
      subnets          = var.subnet_ids
      security_groups  = var.security_group_ids
      assign_public_ip = false
    }

    platform_version = "1.4.0"
  }
}

# Events → ECS assume role
data "aws_iam_policy_document" "events_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "events" {
  name               = "${var.name}-events"
  assume_role_policy = data.aws_iam_policy_document.events_assume.json
  tags               = var.tags
}

data "aws_iam_policy_document" "events_run_task" {
  statement {
    actions   = ["ecs:RunTask", "ecs:DescribeTasks"]
    resources = [aws_ecs_task_definition.td.arn]
  }

  statement {
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.task_exec.arn, aws_iam_role.task_role.arn]
  }
}

resource "aws_iam_policy" "events_run_task" {
  name   = "${var.name}-events-run-task"
  policy = data.aws_iam_policy_document.events_run_task.json
}

resource "aws_iam_role_policy_attachment" "events_attach" {
  role       = aws_iam_role.events.name
  policy_arn = aws_iam_policy.events_run_task.arn
}

output "rule_name" {
  value = aws_cloudwatch_event_rule.rule.name
}

output "task_definition" {
  value = aws_ecs_task_definition.td.arn
}

output "log_group" {
  value = aws_cloudwatch_log_group.lg.name
}
