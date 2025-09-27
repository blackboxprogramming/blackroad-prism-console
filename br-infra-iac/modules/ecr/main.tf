locals { repos = toset(var.repository_names) }

resource "aws_ecr_repository" "repo" {
  for_each                  = local.repos
  name                      = each.value
  image_scanning_configuration { scan_on_push = true }
  encryption_configuration     { encryption_type = "AES256" }
  tags = var.tags
}
