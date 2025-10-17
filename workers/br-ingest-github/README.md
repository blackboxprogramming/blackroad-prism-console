# br-ingest-github

Polling worker for GitHub issues ingestion. The worker consumes a PAT stored in AWS SSM (or the local mock) and upserts issues
into `raw_github_issues`, updating the repo sync watermark file used by the API.

## Running locally

```bash
cd workers/br-ingest-github
npm install
SOURCE_ID=<uuid-from-api> PRISM_DATA_DIR=../../data/prism SSM_MOCK_DIR=../../data/ssm \
  tsx src/index.ts
```

Provide `PG_URL` to write into Postgres; without it the worker will keep the JSON shadow store updated for demos.
