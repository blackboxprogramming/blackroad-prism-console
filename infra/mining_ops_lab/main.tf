terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.2"

  name = "mining-ops-lab"
  cidr = var.vpc_cidr

  azs             = var.azs
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true
  enable_dns_support   = true
}

resource "aws_ecs_cluster" "this" {
  name = "mining-ops-lab"
}

resource "aws_cloudwatch_log_group" "jobs" {
  name              = "/aws/ecs/mining-ops-lab"
  retention_in_days = 30
}

resource "aws_kms_key" "secrets" {
  description             = "Mining Ops Lab secrets encryption"
  deletion_window_in_days = 10
}

resource "aws_iam_role" "task_execution" {
  name               = "mol-task-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks.json
}

data "aws_iam_policy_document" "ecs_tasks" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_ecs_task_definition" "job" {
  family                   = "mol-test-job"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "workload"
      image     = "public.ecr.aws/amazonlinux/amazonlinux:latest"
      essential = true
      command   = ["sleep", "3600"]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.jobs.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "workload"
        }
      }
    },
    {
      name      = "telemetry"
      image     = "public.ecr.aws/docker/library/python:3.11-slim"
      essential = true
      command   = ["python", "-m", "telemetry_agent"]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.jobs.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "telemetry"
        }
      }
    }
  ])
}

resource "aws_security_group" "tasks" {
  name        = "mol-outbound-only"
  description = "Allow outbound-only traffic for mining-ops lab tasks"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
