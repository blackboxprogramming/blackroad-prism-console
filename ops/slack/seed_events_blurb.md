Seeder now runs *inside* the VPC:
- ECS Fargate scheduled task, daily at ~12:12am CT
- Secrets via SSM, logs to CloudWatch
- Builds from br-seed-events to ECR; infra auto-pulls :latest

No more runner access hassle. If data looks thin, bump USERS/EVENTS env in Terraform.

That completes the ingestion loop with zero external runners.
Want me to swing back to PRISM product stories/UX next, or keep layering infra (preview envs on ECS for each PR)?
