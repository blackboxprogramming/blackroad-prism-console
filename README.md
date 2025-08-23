# BlackRoad Prism Console

This repository hosts experimental tooling and prototypes for BlackRoad.io.

## CI/CD orchestrator

`scripts/blackroad_ci.py` provides a scaffold for the end-to-end workflow
connecting Codex, GitHub, external connectors and the deployment droplet. The
script accepts natural language style commands and performs placeholder actions
for now.

Examples:

```bash
python scripts/blackroad_ci.py "Push latest to BlackRoad.io"
python scripts/blackroad_ci.py "Refresh working copy and redeploy"
python scripts/blackroad_ci.py "Rebase branch and update site"
python scripts/blackroad_ci.py "Sync Salesforce -> Airtable -> Droplet"
```

Connector and deployment steps are stubs; configure environment variables and
extend the script to interact with real services.
