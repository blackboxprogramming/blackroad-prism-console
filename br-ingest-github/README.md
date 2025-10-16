# br-ingest-github

Worker that ingests GitHub issues for configured repositories using a PAT stored in SSM.

## Setup

1. Copy `.env.example` to `.env` and fill in the environment variables.
2. Install dependencies with `npm install`.
3. Run `npm run dev` for development or `npm start` after building.

## Deployment

Build the production bundle and container image via:

```bash
npm run build
# or using Docker
docker build -t br-ingest-github .
```

The worker expects the GitHub token to be stored in AWS SSM Parameter Store at the path defined by `GH_TOKEN_PARAM`.
