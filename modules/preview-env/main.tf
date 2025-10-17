terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

locals {
  pr_suffix       = "pr-${var.pr_number}"
  resource_prefix = lower(replace(var.project, " ", "-"))
  service_name    = "${local.resource_prefix}-${local.pr_suffix}"
  container_name  = var.container_name != "" ? var.container_name : local.resource_prefix
}

resource "aws_security_group" "alb" {
  name        = "${local.service_name}-alb"
  description = "Preview ALB security group"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.ingress_cidrs
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.ingress_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    "Name"        = "${local.service_name}-alb"
    "Preview"     = local.pr_suffix
    "Environment" = "preview"
  })
}

resource "aws_security_group" "tasks" {
  name        = "${local.service_name}-tasks"
  description = "Preview task security group"
  vpc_id      = var.vpc_id

  ingress {
    description      = "Allow traffic from the ALB"
    from_port        = var.container_port
    to_port          = var.container_port
    protocol         = "tcp"
    security_groups  = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    "Name"        = "${local.service_name}-tasks"
    "Preview"     = local.pr_suffix
    "Environment" = "preview"
  })
}

resource "aws_lb" "this" {
  name               = substr("${local.service_name}-alb", 0, 32)
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.alb_subnet_ids

  tags = merge(var.tags, {
    "Name"        = "${local.service_name}-alb"
    "Preview"     = local.pr_suffix
    "Environment" = "preview"
  })
}

resource "aws_lb_target_group" "this" {
  name        = substr("${local.service_name}-tg", 0, 32)
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 5
    timeout             = 5
    path                = var.health_check_path
    matcher             = "200-399"
  }

  tags = merge(var.tags, {
    "Name"        = "${local.service_name}-tg"
    "Preview"     = local.pr_suffix
    "Environment" = "preview"
  })
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }
}

resource "aws_lb_listener" "https" {
  count             = var.protocol == "HTTPS" ? 1 : 0
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.listener_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }
}

resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/ecs/${local.service_name}"
  retention_in_days = var.log_retention_in_days

  tags = merge(var.tags, {
    "Preview"     = local.pr_suffix
    "Environment" = "preview"
  })
}

resource "aws_ecs_task_definition" "this" {
  family                   = local.service_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.cpu)
  memory                   = tostring(var.memory)
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn != "" ? var.task_role_arn : null

  container_definitions = jsonencode([
    {
      name      = local.container_name
      image     = var.container_image
      essential = true
      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]
      environment = [
        for key, value in var.env_vars : {
          name  = key
          value = value
        }
      ]
      secrets = var.secrets
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.this.name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = local.container_name
        }
      }
    }
  ])

  tags = merge(var.tags, {
    "Preview"     = local.pr_suffix
    "Environment" = "preview"
  })
}

data "aws_region" "current" {}

resource "aws_ecs_service" "this" {
  name            = local.service_name
  cluster         = var.cluster_arn
  task_definition = aws_ecs_task_definition.this.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"
  propagate_tags  = "SERVICE"

  network_configuration {
    subnets         = var.subnet_ids
    security_groups = [aws_security_group.tasks.id]
    assign_public_ip = var.assign_public_ip
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.this.arn
    container_name   = local.container_name
    container_port   = var.container_port
  }

  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = merge(var.tags, {
    "Preview"     = local.pr_suffix
    "Environment" = "preview"
  })
}

resource "aws_route53_record" "this" {
  zone_id = var.hosted_zone_id
  name    = "${local.pr_suffix}.${var.hosted_zone_name}"
  type    = "A"

  alias {
    name                   = aws_lb.this.dns_name
    zone_id                = aws_lb.this.zone_id
    evaluate_target_health = true
  }

  depends_on = [aws_lb_listener.http]
}
