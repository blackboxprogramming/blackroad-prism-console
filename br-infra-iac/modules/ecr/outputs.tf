output "repo_arns" { value = { for k, r in aws_ecr_repository.repo : k => r.arn } }
