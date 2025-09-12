# Environment Variables

| Name              | Description                                  | Default                                                                | Scope   |
| ----------------- | -------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| `OPENAI_API_KEY`  | API key for OpenAI integrations              | _none_                                                                 | runtime |
| `DATABASE_URL`    | Postgres connection string                   | `postgres://user:pass@db:5432/prism` <!-- pragma: allowlist secret --> | server  |
| `S3_BUCKET`       | S3 bucket for artifacts                      | `prism-artifacts`                                                      | server  |
| `PRISM_RUN_ALLOW` | Comma list of allowed executables for `/run` | `node`                                                                 | server  |

Store secrets in a manager such as HashiCorp Vault or Doppler; avoid committing
plain-text secrets. Populate values locally via `.env` and in production through
your orchestration platform's secret store.
