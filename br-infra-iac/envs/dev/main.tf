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
  app_sg_ids                = [] # put ECS SG here when you add services
  db_allowed_cidr_blocks    = var.db_allowed_cidr_blocks
  instance_class            = var.rds_instance_class
  multi_az                  = false
  backup_retention_days     = 7
  tags                      = local.tags
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

output "api_service_name" { value = module.api_service.service_name }
output "api_url"          { value = module.api_service.https_url }
