locals {
  name = "br-prod"
  tags = merge(var.tags, { env = "prod" })
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
  app_sg_ids                = []
  db_allowed_cidr_blocks    = var.db_allowed_cidr_blocks
  instance_class            = var.rds_instance_class
  multi_az                  = var.rds_multi_az
  backup_retention_days     = var.rds_backup_retention_days
  deletion_protection       = true
  tags                      = local.tags
}

output "vpc_id"          { value = module.network.vpc_id }
output "private_subnets" { value = module.network.private_subnet_ids }
output "ecs_cluster"     { value = module.ecs.cluster_name }
output "ecr_repos"       { value = module.ecr.repo_arns }
output "db_endpoint"     { value = module.rds.db_endpoint }
