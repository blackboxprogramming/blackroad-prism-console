# Preview Environment Stack

This Terraform configuration wraps the reusable `modules/preview-env` module to provision ephemeral review environments per pull request. The stack is parameterised entirely by variables so that automation (for example GitHub Actions) can `terraform apply` with the pull request number and destroy the stack on merge or close.

## Usage

```bash
terraform init
terraform apply \
  -var="pr_number=128" \
  -var="cluster_arn=arn:aws:ecs:us-east-1:123456789012:cluster/prism-preview" \
  -var="execution_role_arn=arn:aws:iam::123456789012:role/ecsExecutionRole" \
  -var="subnet_ids=[\"subnet-123\",\"subnet-456\"]" \
  -var="alb_subnet_ids=[\"subnet-abc\",\"subnet-def\"]" \
  -var="vpc_id=vpc-123456" \
  -var="hosted_zone_id=Z0123456789" \
  -var="hosted_zone_name=dev.blackroad.io" \
  -var="container_image=123456789012.dkr.ecr.us-east-1.amazonaws.com/prism-console:pr128"
```

Running `terraform destroy` with the same arguments cleans up the preview environment.

See the module README for the full list of variables and defaults.
