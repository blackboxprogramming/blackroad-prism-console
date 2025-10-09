# br-seed-events
Seed synthetic app events into Postgres for analytics/dev.

## Use
cp .env.example .env  # edit PG_URL and knobs
npm i
npm run schema
npm run seed

## Hook it into the pipeline
1. Run the seeder (locally or via a GitHub Action/self-hosted runner that can reach Postgres).
2. Your EL worker (`br-ingest-snowpipe`) copies app.events → S3 → Snowflake.
3. dbt builds `stg_app__events` and `fct_events_daily`.
4. Metabase dashboards show DAU/events/purchases.

## Quick task seeds
Task Name,Description,Assignee Email,Section,Due Date
Seed dev events,Run br-seed-events against dev Postgres; 15k events over 14 days.,amundsonalexa@gmail.com,Today,2025-10-12
Verify pipeline end-to-end,EL to Snowflake then dbt build; confirm dashboard tiles populate.,amundsonalexa@gmail.com,Today,2025-10-12

## Slack drop
Seeded 15k synthetic events into dev. EL→Snowflake→dbt is flowing; Metabase dashboard lit. If any tiles look off, ping here and we’ll tune the generator mix.
