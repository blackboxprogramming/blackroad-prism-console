# Infra Module

This Terraform configuration manages Okta, Datadog, Snowflake, and Asana resources for BlackRoad.

## Usage

```bash
./workspaces.sh <env>
terraform init
terraform plan -var-file=env/<env>.tfvars
terraform apply -var-file=env/<env>.tfvars
```

## Plan and Rollback

- **Plan**: `terraform plan -var-file=env/<env>.tfvars`
- **Rollback**: `terraform destroy -var-file=env/<env>.tfvars`
