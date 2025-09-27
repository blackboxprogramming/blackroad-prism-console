output "repo_arns" { value = { for k, r in aws_ecr_repository.repo : k => r.arn } }
output "repo_urls" { value = { for k, r in aws_ecr_repository.repo : k => r.repository_url } }
