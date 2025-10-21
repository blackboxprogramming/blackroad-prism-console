locals {
  name = "br-dev"
  tags = merge(var.tags, { env = "dev" })
}

module "network" {
  source   = "../../modules/network"
  name     = local.name
  vpc_cidr = var.vpc_cidr
  azs      = var.azs
  tags     = local.tags
}

resource "aws_security_group" "app_egress" {
  name        = "${local.name}-app-egress"
  description = "Allow ECS tasks egress to services like RDS"
  vpc_id      = module.network.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

module "ecs" {
  source = "../../modules/ecs-cluster"
  name   = local.name
  tags   = local.tags
}

module "ecr" {
  source            = "../../modules/ecr"
  repository_names  = var.ecr_repositories
  tags              = local.tags
}

module "rds" {
  source                    = "../../modules/rds-postgres"
  name                      = local.name
  vpc_id                    = module.network.vpc_id
  subnet_ids                = module.network.private_subnet_ids
  app_sg_ids                = [aws_security_group.app_egress.id]
  app_sg_ids                = [] # put ECS SG here when you add services
  db_allowed_cidr_blocks    = var.db_allowed_cidr_blocks
  instance_class            = var.rds_instance_class
  multi_az                  = false
  backup_retention_days     = 7
  tags                      = local.tags
}

module "api_waf" {
  source                   = "../../modules/wafv2-alb"
  name                     = "${local.name}-api"
  scope                    = "REGIONAL"
  association_resource_arn = null
  enable_bot_control       = true
  enable_anomaly_rules     = false
  tags                     = local.tags
}

module "waf_logging" {
  source         = "../../modules/waf-logging"
  name           = "br-dev-api"
  region         = var.region
  web_acl_arn    = module.api_waf.web_acl_arn
  s3_bucket_name = "br-dev-waf-logs-${var.region}"
  s3_prefix      = "waf_logs/"
  retention_days = 30
  tags           = local.tags
# WAF on ALB
module "api_waf" {
  source                     = "../../modules/wafv2-alb"
  name                       = "br-dev-api"
  alb_arn                    = module.api_service.alb_arn
  ip_allowlist_cidrs         = []
  ip_blocklist_cidrs         = []
  rate_limit                 = 1000
  enable_common_rules        = true
  enable_ip_reputation_rules = true
  enable_known_bad_inputs    = true
  tags                       = local.tags
}

# Route53 failover to CloudFront maintenance
module "api_failover" {
  source = "../../modules/route53-failover"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  name             = "br-dev-api"
  hosted_zone_name = "blackroad.io."
  domain_name      = "api.blackroad.io"
  alb_dns_name     = module.api_service.alb_dns_name
  alb_zone_id      = module.api_service.alb_zone_id
  health_check_path = "/health"
  tags             = local.tags
}

output "vpc_id"          { value = module.network.vpc_id }
output "private_subnets" { value = module.network.private_subnet_ids }
output "ecs_cluster"     { value = module.ecs.cluster_name }
output "ecr_repos"       { value = module.ecr.repo_arns }
output "db_endpoint"     { value = module.rds.db_endpoint }

resource "aws_ssm_parameter" "api_secret" {
  name  = "/blackroad/dev/api/EXAMPLE_SECRET"
  type  = "SecureString"
  value = "change-me"
  tags  = local.tags
}

resource "aws_ssm_parameter" "pg_url_dev" {
  name  = "/blackroad/dev/pg/url"
  type  = "SecureString"
  value = "postgres://user:pass@rds-host:5432/app"
  tags  = local.tags
}

module "api_service" {
  source             = "../../modules/ecs-service-alb"
  name               = "br-dev-api"
  region             = var.region
  cluster_arn        = module.ecs.cluster_arn
  vpc_id             = module.network.vpc_id
  public_subnet_ids  = module.network.public_subnet_ids
  private_subnet_ids = module.network.private_subnet_ids
  container_name     = "br-api-gateway"
  container_port     = 3001
  image_url          = "${module.ecr.repo_urls["br-api-gateway"]}:${var.api_image_tag}"
  env                = { NODE_ENV = "production" }
  secret_arns        = { EXAMPLE_SECRET = aws_ssm_parameter.api_secret.arn }
  desired_count      = 2
  min_capacity       = 2
  max_capacity       = 6
  hosted_zone_name   = "blackroad.io."
  domain_name        = "api.blackroad.io"
  health_check_path  = "/health"
  tags               = local.tags
}

module "seed_events_cron" {
  source               = "../../modules/ecs-scheduled-task"
  name                 = "br-dev-seed-events"
  cluster_arn          = module.ecs.cluster_arn
  subnet_ids           = module.network.private_subnet_ids
  security_group_ids   = [aws_security_group.app_egress.id]
  image                = "${module.ecr.repo_urls["br-seed-events"]}:latest"
  cpu                  = 256
  memory               = 512
  schedule_expression  = "cron(12 6 * * ? *)"
  region               = var.region
  env = {
    DAYS              = "14"
    USERS             = "500"
    EVENTS            = "15000"
    PURCHASE_RATE     = "0.04"
    SIGNUP_RATE       = "0.15"
    SESSIONS_PER_USER = "3"
  }
  secrets = {
    PG_URL = aws_ssm_parameter.pg_url_dev.arn
  }
  tags = local.tags
}

output "api_service_name" { value = module.api_service.service_name }
output "api_url"          { value = module.api_service.https_url }
output "api_tg_blue_arn"  { value = module.api_service.tg_blue_arn }
output "api_tg_green_arn" { value = module.api_service.tg_green_arn }
output "api_https_listener_arn" { value = module.api_service.https_listener_arn }
output "api_alb_arn_suffix"     { value = module.api_service.alb_arn_suffix }
output "api_waf_arn"     { value = module.api_waf.web_acl_arn }
output "waf_logs_s3"     { value = module.waf_logging.s3_log_path_hint }
