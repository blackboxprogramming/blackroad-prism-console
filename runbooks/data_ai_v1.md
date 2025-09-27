# Data/AI v1 Launch Plan

## Overview
Data/AI v1 establishes the initial analytics foundation so operational and product teams have trustworthy data, repeatable pipelines, and a baseline BI footprint. This plan captures the repos to create, Snowflake configuration, analytics project skeleton, ingestion workers, BI starter assets, cadence, and comms required to reach "done-done" for the track.

## Deliverables
- Snowflake baseline (roles, databases, warehouses, schemas, grants) with credentials vaulted in 1Password / AWS SSM.
- Analytics transformation repo (`br-dbt`) with CI, staging + mart models, docs, and nightly schedules.
- Ingestion workers for Airtable -> Postgres and Postgres -> Snowflake.
- Starter semantic layer and Metabase dashboard.
- Cadence for nightly runs, CI on merge, weekly BI reviews, freshness alerting, and governance for mart models.

## 1. Repository Setup
Create three new repositories with protected `main` branches and <10 minute CI pipelines:

| Repo | Purpose | Notes |
| ---- | ------- | ----- |
| `br-dbt` | dbt project for transformations, tests, and docs | GitHub Actions CI running `dbt build --warn-error`. |
| `br-ingest-airtable` | Node worker syncing Airtable -> Postgres incrementally | Nightly schedule via GitHub Actions cron or ECS Fargate. |
| `br-ingest-snowpipe` | Node worker shipping Postgres -> Snowflake | Implement via Snowpipe PUT/COPY or Snowflake connector. |

## 2. Snowflake Baseline (IaC-lite + Runbook)
Capture in Notion runbook **"Snowflake Baseline"** and run once in Snowflake UI (automation later). Ensure credentials go to 1Password and surface to CI via env/SSM—never commit secrets.

```sql
-- 1) Roles
CREATE ROLE IF NOT EXISTS BR_SYSADMIN;
CREATE ROLE IF NOT EXISTS BR_TRANSFORM;
CREATE ROLE IF NOT EXISTS BR_READONLY;

-- 2) Users (service principals)
CREATE USER IF NOT EXISTS BR_DBT
  PASSWORD = '***rotate***' DEFAULT_ROLE = BR_TRANSFORM MUST_CHANGE_PASSWORD = TRUE;
CREATE USER IF NOT EXISTS BR_EL
  PASSWORD = '***rotate***' DEFAULT_ROLE = BR_TRANSFORM MUST_CHANGE_PASSWORD = TRUE;

-- 3) Databases & Warehouses
CREATE WAREHOUSE IF NOT EXISTS BR_WH_DEV   WITH WAREHOUSE_SIZE = XSMALL AUTO_SUSPEND=60 AUTO_RESUME=TRUE;
CREATE WAREHOUSE IF NOT EXISTS BR_WH_PROD  WITH WAREHOUSE_SIZE = SMALL  AUTO_SUSPEND=60 AUTO_RESUME=TRUE;

CREATE DATABASE IF NOT EXISTS BR_RAW;
CREATE DATABASE IF NOT EXISTS BR_ANALYTICS;

-- 4) Schemas
CREATE SCHEMA IF NOT EXISTS BR_RAW.AIRTABLE;
CREATE SCHEMA IF NOT EXISTS BR_RAW.APP;
CREATE SCHEMA IF NOT EXISTS BR_ANALYTICS.STG;
CREATE SCHEMA IF NOT EXISTS BR_ANALYTICS.MART;

-- 5) Grants
GRANT USAGE ON WAREHOUSE BR_WH_DEV  TO ROLE BR_TRANSFORM;
GRANT USAGE ON WAREHOUSE BR_WH_PROD TO ROLE BR_TRANSFORM;

GRANT USAGE ON DATABASE BR_RAW        TO ROLE BR_TRANSFORM;
GRANT USAGE ON DATABASE BR_ANALYTICS  TO ROLE BR_TRANSFORM;

GRANT USAGE ON SCHEMA BR_RAW.AIRTABLE       TO ROLE BR_TRANSFORM;
GRANT USAGE ON SCHEMA BR_RAW.APP            TO ROLE BR_TRANSFORM;
GRANT USAGE ON SCHEMA BR_ANALYTICS.STG      TO ROLE BR_TRANSFORM;
GRANT USAGE ON SCHEMA BR_ANALYTICS.MART     TO ROLE BR_TRANSFORM;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA BR_RAW.AIRTABLE TO ROLE BR_TRANSFORM;
GRANT SELECT ON ALL TABLES IN DATABASE BR_RAW TO ROLE BR_READONLY;
GRANT SELECT ON ALL VIEWS  IN DATABASE BR_ANALYTICS TO ROLE BR_READONLY;

-- Future grants (keep painless)
GRANT SELECT ON FUTURE TABLES IN DATABASE BR_RAW TO ROLE BR_READONLY;
GRANT SELECT ON FUTURE VIEWS  IN DATABASE BR_ANALYTICS TO ROLE BR_READONLY;
```

## 3. `br-dbt` Project Skeleton
```
br-dbt/
  dbt_project.yml
  profiles.yml.example
  packages.yml
  models/
    staging/
      stg_airtable__projects.sql
      stg_app__events.sql
      staging.yml
    marts/
      ops/
        fct_projects.sql
        dim_owners.sql
        ops.yml
  macros/
  tests/
  .github/workflows/ci.yml
  README.md
```

**dbt project config**
```yaml
name: br_dbt
version: 0.1.0
profile: br_dbt
models:
  br_dbt:
    +materialized: view
    staging: { +materialized: view, +tags: ["staging"] }
    marts:   { +materialized: table, +tags: ["mart"] }
```

**profiles.yml.example**
```yaml
br_dbt:
  target: dev
  outputs:
    dev:
      type: snowflake
      account: ${SNOWFLAKE_ACCOUNT}
      user: ${SNOWFLAKE_USER}
      password: ${SNOWFLAKE_PASSWORD}
      role: BR_TRANSFORM
      database: BR_ANALYTICS
      warehouse: BR_WH_DEV
      schema: STG
```

**Key models**
- `models/staging/stg_airtable__projects.sql`
- `models/marts/ops/fct_projects.sql`
- `models/staging/staging.yml` (sources, tests, freshness)

**CI Workflow (`.github/workflows/ci.yml`)**
1. Checkout code.
2. Setup Python 3.11.
3. Install `dbt-snowflake`.
4. Run `dbt deps`, `dbt debug`, `dbt build --warn-error` using secrets for Snowflake credentials.

## 4. Ingestion Workers
### `br-ingest-airtable`
- Node worker using Airtable SDK + `pg` library.
- Environment variables: `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `PG_URL`.
- Maintain state table to fetch records with `createdTime > last_run_at` and upsert into `ops.projects` in Postgres.
- Schedule nightly via GitHub Actions cron or ECS Fargate.

### `br-ingest-snowpipe`
- Move Postgres `ops.*` tables into Snowflake.
- Options:
  - Export to CSV/Parquet -> S3 -> Snowflake stage + `COPY INTO` via Snowpipe.
  - Snowflake Node connector issuing `INSERT`/`MERGE` (fine for small scale).
- Trigger nightly after transforms or on-demand.

## 5. BI Starter & Semantic Layer
- Add `metrics.yml` defining `active_projects` (`count_distinct` on `project_id` with `status = 'Active'`).
- Provision Metabase connection using `BR_READONLY` role.
- Create dashboard "Ops Overview" with tiles: Active Projects, New Projects This Week, Projects by Owner.

## 6. Cadence & Governance
- Nightly: `dbt build` in dev/stg with freshness tests.
- On merge: CI runs targeted `dbt build` and publishes docs artifacts.
- Weekly: BI review covering changes, stale assets, retirements.
- Governance: each mart model has an owner and at least one test; freshness failures alert owners.

## 7. Slack Announcements
**#ops**
```
Data/AI v1 kicking off:
- Snowflake baseline (roles/DBs/wh)
- dbt project with staging->mart and CI
- Airtable->Postgres worker + Postgres->Snowflake EL
- Metabase dashboard "Ops Overview"

Weekly BI review starts next Friday. Freshness tests will page us if data gets stale.
```

**#eng**
```
Heads-up: dbt CI is strict (`--warn-error`). Broken tests = blocked merge.
Keep models small, documented, and covered with tests. Owners on every mart.
```

## 8. Definition of Done (Friday Target)
- Snowflake roles, databases, warehouses created; credentials stored in vaults.
- `br-dbt` CI green with docs page rendering.
- Airtable -> Postgres -> Snowflake pipeline live (staging + mart models).
- Metabase "Ops Overview" dashboard shows real data and is linked in Notion.
- Freshness tests active with clear ownership.
