# Environment Variables

| Name                  | Description                                                  | Default                                      | Scope   |
| --------------------- | ------------------------------------------------------------ | -------------------------------------------- | ------- |
| `OPENAI_API_KEY`      | API key for OpenAI integrations                              | _none_                                       | runtime |
| `DATABASE_URL`        | Postgres connection string                                   | `postgres://user:pass@db:5432/prism` <!-- pragma: allowlist secret --> | server  |
| `S3_BUCKET`           | S3 bucket for artifacts                                      | `prism-artifacts`                            | server  |
| `PRISM_RUN_ALLOW`     | Comma list of allowed executables for `/run`                 | `node`                                       | server  |
| `GRAFANA_PANEL_*`     | Grafana panel deep link per system key (e.g., `GRAFANA_PANEL_API`) | _none_                                       | portal  |
| `SECHUB_LINK_*`       | AWS Security Hub deep link per system key                    | _none_                                       | portal  |
| `COSTEXPLORER_LINK_*` | AWS Cost Explorer link per system key                        | _none_                                       | portal  |
| `RISK_BURN_FEED_URL`  | Reliability burn feed (CloudWatch JSON or cached file)       | `portal/reports/risk_burn.json`              | portal  |
| `SECURITY_FEED_URL`   | Security findings feed JSON (critical/high counts by system) | `portal/reports/security_feed.json`          | portal  |
| `COST_FEED_URL`       | Cost feed JSON (actual vs. forecast by system)               | `portal/reports/cost_feed.json`              | portal  |
| `SLACK_WEBHOOK`       | Incoming webhook for #exec digest                            | _none_                                       | portal  |

Store secrets in a manager such as HashiCorp Vault or Doppler; avoid committing
plain-text secrets. Populate values locally via `.env` and in production through
your orchestration platform's secret store.
