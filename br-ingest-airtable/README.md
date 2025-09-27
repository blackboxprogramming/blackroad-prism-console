# br-ingest-airtable

Nightly (or on-demand) Airtable to Postgres sync for `ops.projects`.

## Setup

1. Copy `.env.example` to `.env` and fill in Airtable + Postgres credentials.
2. Install dependencies with `npm ci`.
3. Run migrations once: `npm run migrate`.
4. Build the worker: `npm run build` or run locally with `npm run dev`.
5. Execute the sync: `npm start`.

## Scheduling

- Run via cron, GitHub Actions, or containerized task.
- Docker image is multi-stage and ready for deployment.

## Environment Variables

- `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE`
- `PG_URL`
- Optional `BATCH_SIZE` (defaults to 50)
