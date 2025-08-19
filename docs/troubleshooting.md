# Troubleshooting

### Vite build fails on missing asset

Create placeholder files under `sites/blackroad/public/` or update import paths. The codex bridge auto-creates common placeholders.

### ESLint errors

ESLint is advisory in CI. Locally, run `npm run lint` to fix most issues. If config missing, the bridge seeds a minimal one.

### Previews not posting

Provider secrets/vars missing. Workflows are skip-safe; add required secrets and re-run.

### Status/Snapshot not updating

Check `Uptime JSON` and `Cache Warm + Screenshot` workflows. Ensure repo has write permission and branch is not protected against bot commits.
