# Status Site Deployment Plan

BlackRoad's public status page (`status.blackroad.io`) runs on a static site delivered through Amazon S3 and CloudFront with an ACM certificate anchored in `us-east-1`. The Terraform module at `modules/status-site` provisions the certificate, DNS, and delivery pipeline so the team only needs to supply the hosted zone name, vanity domain, and shared tags.

## Terraform Module

```hcl
module "status_site" {
  source           = "../../modules/status-site"
  name             = "status"
  hosted_zone_name = "blackroad.io."
  domain_name      = "status.blackroad.io"
  tags = {
    Project = "Reliability"
    Owner   = "Alexa Amundson"
  }
}
```

The module creates:

- ACM certificate in `us-east-1` with DNS validation records.
- Private S3 bucket (no public ACLs) for the static app.
- CloudFront distribution with Origin Access Control and TLS 1.2 2021 policy.
- Route53 alias record pointing `status.blackroad.io` at CloudFront.

Outputs expose the bucket name for deploy jobs and the CloudFront hostname for health monitoring.

## Status Application Options

Choose either approach for the static site artifacts that land in the provisioned bucket:

1. **Hugo / cstate fork** – fastest path; edit incidents via Markdown and push rendered HTML.
2. **Next.js status app** – hosts richer UI components and direct API polling; build to static output and sync the `out/` (or `public/`) directory to S3.

Both flows should invalidate CloudFront after uploads to avoid stale assets.

## Health Check Feeds

Use Route53 health checks to watch production surfaces and supply JSON to the status app.

```hcl
resource "aws_route53_health_check" "api" {
  type            = "HTTPS"
  fqdn            = "api.blackroad.io"
  resource_path   = "/health"
  port            = 443
  measure_latency = true
  regions         = ["us-east-1", "us-west-1", "us-west-2"]
  tags            = local.tags
}
```

Export health check status nightly to S3 (e.g., via Lambda) or query live endpoints client-side. Start with `/api/health` and `/products` and expand coverage as new services launch.

## Deployment Workflow

1. Create repository `br-status-site` with selected app scaffold.
2. GitHub Actions builds the site and runs `aws s3 sync ./public s3://$STATUS_BUCKET --delete` with the module output bucket.
3. Invalidate CloudFront (`aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"`).
4. DNS already points `status.blackroad.io` at CloudFront; certificate covers the alias.
5. Incidents publish via content commits (Markdown/JSON) or automation from Asana/Notion.

## Operational Runway

- **Asana Tasks** – `ops/next_push/status_site_asana_tasks.csv` seeds the operations board with provisioning, repo, health check, alerting, and launch validation work.
- **Slack Comms** – `ops/next_push/slack_posts.md` includes an announcement template for #announcements once the page is live.
- **Next Iteration Decision** – After launch, decide whether to prioritize a Cost & Spend reporting board or developer experience automation (CI templates, PR linting, preview environments).
