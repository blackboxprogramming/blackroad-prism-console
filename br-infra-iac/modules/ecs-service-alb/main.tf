terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

resource "aws_security_group" "alb" {
  name   = "${var.name}-alb-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

resource "aws_security_group" "svc" {
  name   = "${var.name}-svc-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port                = var.container_port
    to_port                  = var.container_port
    protocol                 = "tcp"
    source_security_group_id = aws_security_group.alb.id
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

resource "aws_lb" "this" {
  name               = "${var.name}-alb"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids
  idle_timeout       = 60
  tags               = var.tags
}

resource "aws_lb_target_group" "tg" {
  name        = "${var.name}-tg"
  vpc_id      = var.vpc_id
  port        = var.container_port
  protocol    = "HTTP"
  target_type = "ip"

  health_check {
    path                = var.health_check_path
    matcher             = "200"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 15
    timeout             = 5
  }

  tags = var.tags
}

resource "aws_lb_target_group" "tg_canary" {
  name        = "${var.name}-tg-canary"
  vpc_id      = var.vpc_id
  port        = var.container_port
  protocol    = "HTTP"
  target_type = "ip"

  health_check {
    path                = var.health_check_path
    matcher             = "200"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 15
    timeout             = 5
  }

  tags = var.tags
}

data "aws_route53_zone" "zone" {
  name         = var.hosted_zone_name
  private_zone = false
}

resource "aws_acm_certificate" "cert" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = var.tags
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.zone.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate_validation.cert.certificate_arn

  default_action {
    type = "forward"

    forward {
      dynamic "target_group" {
        for_each = local.forward_target_groups

        content {
          arn    = target_group.value.arn
          weight = target_group.value.weight
        }
      }

      stickiness {
        enabled = false
      }
    }
  }
}

resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.zone.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.this.dns_name
    zone_id                = aws_lb.this.zone_id
    evaluate_target_health = false
  }
}

resource "aws_cloudwatch_log_group" "svc" {
  name              = "/blackroad/${var.name}"
  retention_in_days = 30
  tags              = var.tags
}

locals {
  container_name     = var.container_name
  env_kv             = [for k, v in var.env : { name = k, value = v }]
  secret_kv          = [for k, v in var.secret_arns : { name = k, valueFrom = v }]
  secret_arn_values  = values(var.secret_arns)
  cluster_name_parts = split("/", var.cluster_arn)
  cluster_name       = local.cluster_name_parts[length(local.cluster_name_parts) - 1]
  canary_weight      = max(0, min(100, var.canary_weight))
  primary_weight     = 100 - local.canary_weight
  forward_target_groups = local.canary_weight > 0 ? [
    {
      arn    = aws_lb_target_group.tg.arn
      weight = local.primary_weight
    },
    {
      arn    = aws_lb_target_group.tg_canary.arn
      weight = local.canary_weight
    }
  ] : [
    {
      arn    = aws_lb_target_group.tg.arn
      weight = 100
    }
  ]
}

data "aws_iam_policy_document" "task_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "task_execution" {
  name               = "${var.name}-exec"
  assume_role_policy = data.aws_iam_policy_document.task_assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "exec_default" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "ssm_access" {
  count = length(local.secret_arn_values) > 0 ? 1 : 0

  statement {
    actions   = ["ssm:GetParameters", "ssm:GetParameter"]
    resources = local.secret_arn_values
  }
}

resource "aws_iam_policy" "ssm_access" {
  count  = length(local.secret_arn_values) > 0 ? 1 : 0
  name   = "${var.name}-ssm-access"
  policy = data.aws_iam_policy_document.ssm_access[0].json
}

resource "aws_iam_role_policy_attachment" "exec_ssm" {
  count      = length(local.secret_arn_values) > 0 ? 1 : 0
  role       = aws_iam_role.task_execution.name
  policy_arn = aws_iam_policy.ssm_access[0].arn
}

resource "aws_iam_role" "task_role" {
  name               = "${var.name}-task"
  assume_role_policy = data.aws_iam_policy_document.task_assume.json
  tags               = var.tags
}

resource "aws_ecs_task_definition" "this" {
  family                   = "${var.name}-td"
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task_role.arn

  container_definitions = jsonencode([
    {
      name  = local.container_name
      image = var.image_url
      portMappings = [
        {
          containerPort = var.container_port
          hostPort       = var.container_port
          protocol       = "tcp"
        }
      ]
      environment = local.env_kv
      secrets     = local.secret_kv
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.svc.name
          awslogs-region        = var.region
          awslogs-stream-prefix = local.container_name
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

resource "aws_ecs_service" "this" {
  name                   = "${var.name}-svc"
  cluster                = var.cluster_arn
  task_definition        = aws_ecs_task_definition.this.arn
  desired_count          = var.desired_count
  launch_type            = "FARGATE"
  enable_execute_command = true
  deployment_controller {
    type = "ECS"
  }
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  force_new_deployment = true

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.svc.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.tg.arn
    container_name   = local.container_name
    container_port   = var.container_port
  }

  propagate_tags = "SERVICE"
  tags           = var.tags

  depends_on = [aws_lb_listener.https]
}

resource "aws_appautoscaling_target" "svc" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${local.cluster_name}/${aws_ecs_service.this.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu_target" {
  name               = "${var.name}-cpu-50"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.svc.resource_id
  scalable_dimension = aws_appautoscaling_target.svc.scalable_dimension
  service_namespace  = aws_appautoscaling_target.svc.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 50
    scale_in_cooldown  = 60
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
