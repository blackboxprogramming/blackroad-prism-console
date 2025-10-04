# BlackRoad Release Notes Composer

`br-release-notes` bundles a small CLI (`br-notes`) that generates release notes for BlackRoad services. It reads commit history, Conventional Commit metadata, PR "Release note" bullets, and incident files from the status site, then renders one of the standard templates (API, UI, Ingest, Infra, dbt).

## Usage

```bash
npm install
npm run build
REPO_OWNER=blackboxprogramming \
REPO_NAME=br-api-gateway \
BASE_REF=v0.1.0 \
HEAD_REF=v0.2.0 \
GITHUB_TOKEN=ghp_example \
RELEASE_KIND=api \
node dist/index.js
```

The CLI prints the composed Markdown body and also sets a `body` output when executed within GitHub Actions.

## Environment variables

| Variable | Description |
| --- | --- |
| `GITHUB_TOKEN` | Token with `repo` scope for GitHub API calls. |
| `REPO_OWNER` / `REPO_NAME` | Repository owner/name pair. |
| `BASE_REF` / `HEAD_REF` | Git references that bound the release window. |
| `NEXT_VERSION` | Version string injected into the template. |
| `RELEASE_KIND` | Template key (`api`, `ui`, `ingest`, `infra`, or `dbt`). |
| `COMPARE_URL` | Optional override for the changelog diff link. |
| `INCIDENTS_DIR` | Path to the cstate issues directory. Defaults to `../br-status-site/content/issues`. |
| `WINDOW_FROM` / `WINDOW_TO` | Optional ISO timestamps limiting incidents to the release window. |

## Development

* `npm run build` compiles TypeScript to `dist/`.
* Templates live in `templates/` and can be extended with additional placeholders.
* Unit tests are not included yet; rely on manual dry runs while the workflow matures.
