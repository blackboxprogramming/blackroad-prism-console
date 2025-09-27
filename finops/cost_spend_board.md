# Cost & Spend Visibility Board

This playbook captures the initial infrastructure, tooling, and communications needed to get AWS and SaaS spend under control as BlackRoad scales.

## 1. AWS Cost & Usage Pipeline

### Architecture Overview
- **Cost & Usage Report (CUR)** delivers hourly cost data in Parquet format to an encrypted S3 bucket.
- **AWS Glue** catalogs the CUR data.
- **Athena** queries the cataloged data for ad-hoc spend analysis.
- **QuickSight (optional)** provides lightweight dashboards over Athena datasets.

### Terraform Module
Use the new module at `modules/cost-usage` to provision the CUR pipeline.

```hcl
module "cost_usage" {
  source          = "./modules/cost-usage"
  name            = "blackroad"
  s3_bucket_name  = "blackroad-cost-usage"
  region          = "us-east-1"
  report_name     = "blackroad-cur"
  tags = {
    CostCenter = "finops"
    Owner      = "platform"
  }
}
```

Outputs:
- `cur_bucket` – S3 bucket receiving CUR data
- `athena_db` – Glue database backing Athena
- `athena_table` – Glue table for querying CUR data

## 2. AWS Budget Alerts

Deploy an 80% threshold alert on a $5K monthly budget. Subscribe the notification to the FinOps SNS → Slack integration.

```hcl
resource "aws_budgets_budget" "monthly" {
  name         = "blackroad-monthly"
  budget_type  = "COST"
  limit_amount = "5000"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_types {
    use_amortized = false
    use_blended   = false
  }

  time_period_start = "2025-01-01_00:00"

  notification {
    comparison_operator = "GREATER_THAN"
    threshold           = 80
    threshold_type      = "PERCENTAGE"
    notification_type   = "ACTUAL"

    subscriber {
      subscription_type = "SNS"
      address            = module.mon_alarms.sns_topic_arn
    }
  }
}
```

## 3. SaaS Spend Tracking (Airtable)

Create an Airtable base named **BlackRoad Spend** with table **SaaS Vendors** containing these fields:
- Vendor (single line text)
- Category (single select; e.g., Comms, PM, Design, Security)
- Monthly Cost (currency)
- Owner (collaborator or text)
- Renewal Date (date)
- Notes (long text)

Views to configure:
1. **By Owner** – group by Owner to review accountable teams.
2. **By Renewal Date** – sorted ascending to surface upcoming renewals.
3. **Total by Category** – summary bar chart or pivot to show category totals.

Seed with the top vendors: Slack, Asana, Figma, Notion, Datadog, Snyk.

Automation idea: Connect billing inbox to Airtable via Zapier/Make to append line items; manual updates are acceptable until volumes grow.

## 4. Notion Spend Dashboard

Create a Notion page with sections:
- **AWS Spend** – embed an Athena visualization (QuickSight dashboard or static query screenshot). Include quick metrics for the latest month.
- **SaaS Spend** – embed the Airtable "BlackRoad Spend" view.
- **Budget vs Actual** – summarize the $5K budget, current month forecast, and highlight any budget alerts.

## 5. Communication Artifacts

- Asana CSV tasks for Ops-Finance handoff: see `ops/finance/cost_spend_tasks.csv` for import.
- Slack announcement for `#finance`: see `ops/slack/spend_visibility_baseline.md`.

## 6. Next Decision Point

Once this baseline lands, choose the next track:
- **Developer Experience** – preview environments, PR linting, repo templates.
- **Data/AI** – warehouse (Snowflake/BigQuery) plus dbt skeleton.

Document the choice and feed it into the roadmap once leadership aligns.
