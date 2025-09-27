locals {
  project_name = var.project != "" ? var.project : "prism-console"
}

module "preview_environment" {
  source = "../../modules/preview-env"

  project             = local.project_name
  pr_number           = var.pr_number
  cluster_arn         = var.cluster_arn
  execution_role_arn  = var.execution_role_arn
  task_role_arn       = var.task_role_arn
  subnet_ids          = var.subnet_ids
  alb_subnet_ids      = var.alb_subnet_ids
  vpc_id              = var.vpc_id
  hosted_zone_id      = var.hosted_zone_id
  hosted_zone_name    = var.hosted_zone_name
  container_image     = var.container_image
  container_name      = var.container_name
  container_port      = var.container_port
  desired_count       = var.desired_count
  cpu                 = var.cpu
  memory              = var.memory
  assign_public_ip    = var.assign_public_ip
  env_vars            = var.env_vars
  secrets             = var.secrets
  health_check_path   = var.health_check_path
  protocol            = var.protocol
  listener_certificate_arn = var.listener_certificate_arn
  ingress_cidrs            = var.ingress_cidrs
  log_retention_in_days    = var.log_retention_in_days
  tags                     = var.tags
}

output "preview_url" {
  description = "Preview URL generated for the pull request."
  value       = module.preview_environment.url
}

output "service_name" {
  description = "Name of the ECS service deployed for the preview."
  value       = module.preview_environment.service_name
}
