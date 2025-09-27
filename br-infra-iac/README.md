# BlackRoad Terraform Baseline

## What you get
- Remote state (S3 + DynamoDB)
- GitHub OIDC role for Terraform (no long-lived AWS keys)
- VPC (2 AZs, public + private, IGW + single NAT)
- ECS Cluster (Fargate + Container Insights)
- ECR repos (scanning on push)
- RDS Postgres (password managed by AWS; not stored in code)

## One-time bootstrap
```bash
make bootstrap-init
cp global/bootstrap/terraform.tfvars.example global/bootstrap/terraform.tfvars
# edit values (state bucket, table, org/repo)
make bootstrap-apply

Copy oidc_role_arn to repo secret AWS_ROLE_TO_ASSUME. Set repo variable AWS_REGION.

Deploy dev

cp envs/dev/terraform.tfvars.example envs/dev/dev.tfvars
# tweak values
make init ENV=dev
make plan ENV=dev
make apply ENV=dev

CI/CD
  • PR → terraform plan
  • Push to main (env: aws-dev) → terraform apply (environment protection recommended)

Notes
  • NAT gateways cost money; keep one NAT (default here) and monitor.
  • For app access to DB, prefer SG-to-SG rules (set app_sg_ids).
  • RDS master password is managed by AWS; fetch when needed via AWS console/Secrets Manager (no plaintext in code).
```

---

That’s your baseline. Next moves I can tee up fast:
- **Helm/Ingress** add-on for ECS service or an ALB-backed example service.
- **Route53** + ACM certificates and ALB for `api.blackroad.io`.
- **SSM Parameter Store** wiring for app env vars with `task_definition` examples.

Pick one and I’ll drop the files.
